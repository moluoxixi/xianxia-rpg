import type { HostScenarioGeneratePayload, HostScenarioGenerateResult } from '@xianxia-rpg/core';
import type { AIProviderConfig } from './ai';
import { z } from 'zod';
import { chatWithAI } from './ai';

const sceneSchema = z.object({
  name: z.string(),
  type: z.string(),
  region: z.string(),
  description: z.string(),
  connectedScenes: z.array(z.string()).max(6),
  npcs: z.array(z.string()).max(8),
  availableResources: z.array(z.string()).max(8),
  isDangerous: z.boolean(),
});

const npcSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['story', 'enemy', 'merchant', 'mentor', 'boss']),
  location: z.string(),
  realm: z.string(),
  sect: z.string().optional(),
  favorability: z.number().int().min(-100).max(100),
  attackable: z.boolean(),
  description: z.string(),
});

const inventoryItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  count: z.number().int().min(1).max(999),
  type: z.string().optional(),
  rarity: z.string().optional(),
  description: z.string().optional(),
  usable: z.boolean().optional(),
});

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  level: z.string(),
  type: z.string().optional(),
  proficiency: z.number().int().min(0).max(100).optional(),
  source: z.string().optional(),
});

const characterSchema = z.object({
  name: z.string(),
  realm: z.string(),
  sect: z.string(),
  location: z.string(),
});

const scenarioSeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  stylePrompt: z.string(),
  openingMessage: z.string(),
  player: characterSchema,
  initialSceneName: z.string(),
  scenes: z.array(sceneSchema).min(1).max(6),
  npcs: z.array(npcSchema).max(8),
  inventory: z.array(inventoryItemSchema).min(1).max(8),
  skills: z.array(skillSchema).max(6),
  quickActions: z.array(z.string()).min(4).max(8),
}).refine(seed => seed.scenes.some(scene => scene.name === seed.initialSceneName), 'initialSceneName 必须存在于 scenes 中');

export async function generateScenarioWithAI(config: AIProviderConfig, payload: HostScenarioGeneratePayload): Promise<HostScenarioGenerateResult> {
  if (!config.apiKey || config.apiKey === 'YOUR_API_KEY')
    return { success: false, message: 'AI 开局生成需要先配置模型 API Key。' };

  try {
    const result = await chatWithAI(
      { ...config, maxTokens: 1200, temperature: 0.5, systemPrompt: createScenarioSystemPrompt() },
      { messages: [], userMessage: createScenarioUserPrompt(payload) },
    );
    if (!result.success)
      return { success: false, message: `AI 开局生成失败：${result.error ?? '未知错误'}` };

    return { success: true, data: normalizeScenarioSeed(scenarioSeedSchema.parse(JSON.parse(extractJsonObject(result.reply)))) };
  }
  catch (error) {
    return { success: false, message: `AI 开局生成结果解析失败：${error instanceof Error ? error.message : String(error)}` };
  }
}

function normalizeScenarioSeed(seed: z.infer<typeof scenarioSeedSchema>): z.infer<typeof scenarioSeedSchema> {
  return {
    ...seed,
    scenes: seed.scenes.map(scene => ({ ...scene, type: normalizeSceneType(scene.type) })),
    inventory: seed.inventory.map(item => ({ ...item, type: normalizeInventoryType(item.type), rarity: normalizeRarity(item.rarity) })),
    skills: seed.skills.map(skill => ({ ...skill, type: normalizeSkillType(skill.type) })),
  };
}

function normalizeSceneType(value: string): 'sect' | 'town' | 'wild' | 'dungeon' | 'shop' | 'residence' {
  const values = ['sect', 'town', 'wild', 'dungeon', 'shop', 'residence'] as const;
  return values.includes(value as typeof values[number]) ? value as typeof values[number] : 'wild';
}

function normalizeInventoryType(value: string | undefined): 'pill' | 'spirit_stone' | 'weapon' | 'material' | 'talisman' | 'manual' | 'quest' | 'misc' {
  const values = ['pill', 'spirit_stone', 'weapon', 'material', 'talisman', 'manual', 'quest', 'misc'] as const;
  return values.includes(value as typeof values[number]) ? value as typeof values[number] : 'misc';
}

function normalizeRarity(value: string | undefined): 'common' | 'low' | 'middle' | 'high' | 'top' | 'rare' {
  const values = ['common', 'low', 'middle', 'high', 'top', 'rare'] as const;
  return values.includes(value as typeof values[number]) ? value as typeof values[number] : 'common';
}

function normalizeSkillType(value: string | undefined): 'main' | 'combat' | 'movement' | 'alchemy' | 'crafting' | 'spiritual_sense' | 'support' {
  const values = ['main', 'combat', 'movement', 'alchemy', 'crafting', 'spiritual_sense', 'support'] as const;
  return values.includes(value as typeof values[number]) ? value as typeof values[number] : 'support';
}

function createScenarioSystemPrompt(): string {
  return `你是半开放式文字 RPG 的开局设计器。你只返回 JSON，不要 Markdown。
任务：根据参考小说生成一个原创开局 seed，供游戏系统落库存档。
硬性要求：
1. 只借鉴题材、力量体系、势力氛围和叙事节奏，不复述原文，不输出章节正文。
2. 初始场景、NPC、道具、能力/技能和快捷指令必须彼此一致，适合玩家第一回合行动。
3. 不要让玩家开局过强；道具和能力/技能必须服务半开放探索。
4. scenes 固定 3 个：初始场景和 2 个可前往场景；NPC 固定 2 到 3 个，location 必须是 scenes 中的场景名。
5. openingMessage 写给玩家，200 字以内。
6. inventory 3 到 5 个，skills 1 到 3 个，quickActions 4 到 6 个。
JSON 结构：
{"title":"剧本名","description":"剧本设定","stylePrompt":"给叙事 AI 的风格约束","openingMessage":"开局描述","player":{"name":"玩家名","realm":"境界/身份","sect":"势力","location":"初始场景名"},"initialSceneName":"初始场景名","scenes":[{"name":"场景名","type":"town","region":"区域","description":"描述","connectedScenes":["其他场景"],"npcs":["npc_id"],"availableResources":["资源"],"isDangerous":false}],"npcs":[{"id":"npc_id","name":"NPC名","role":"story","location":"场景名","realm":"境界/身份","sect":"势力","favorability":0,"attackable":false,"description":"描述"}],"inventory":[{"name":"物品","count":1,"type":"misc","rarity":"common","description":"用途","usable":false}],"skills":[{"name":"能力","level":"入门","type":"support","proficiency":0,"source":"来源"}],"quickActions":["观察四周","询问身份","前往某地","整理背包"]}`;
}

function createScenarioUserPrompt(payload: HostScenarioGeneratePayload): string {
  return `参考小说：${payload.referenceNovel}
作者：${payload.author ?? '未知'}
参考描述：${payload.description ?? '无'}
游戏题材 ID：${payload.gameTypeId}
UI 主题 ID：${payload.themeId}
难度：${payload.difficulty}
请生成一个可直接进入游戏的开局 seed。`;
}

function extractJsonObject(text: string): string {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex < 0 || endIndex < startIndex)
    throw new Error('AI 开局生成未返回 JSON 对象');
  return text.slice(startIndex, endIndex + 1);
}
