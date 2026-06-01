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

const attributeSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number().int().min(0).max(9999),
  max: z.number().int().min(1).max(9999),
  statKey: z.enum(['hp', 'mp', 'exp']).optional(),
  description: z.string().optional(),
});

const scenarioSeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  stylePrompt: z.string(),
  openingMessage: z.string(),
  player: characterSchema,
  attributes: z.array(attributeSchema).min(3).max(5),
  initialSceneName: z.string(),
  scenes: z.array(sceneSchema).min(1).max(6),
  npcs: z.array(npcSchema).max(8),
  inventory: z.array(inventoryItemSchema).min(1).max(8),
  skills: z.array(skillSchema).max(6),
  quickActions: z.array(z.string()).min(4).max(8),
}).refine(seed => seed.scenes.some(scene => scene.name === seed.initialSceneName), 'initialSceneName 必须存在于 scenes 中');

interface ReferenceProtagonistHint {
  aliases: string[];
  name: string;
  openingIdentity: string;
  openingFaction: string;
  openingLocation: string;
}

const referenceProtagonistHints: ReferenceProtagonistHint[] = [
  {
    aliases: ['第一序列'],
    name: '任小粟',
    openingIdentity: '113号壁垒外集镇流民少年，具备荒野求生经验与谨慎的行动风格',
    openingFaction: '集镇、学堂、诊所和壁垒秩序边缘的弱关系网络',
    openingLocation: '113号壁垒外集镇、诊所或学堂附近',
  },
  {
    aliases: ['诡秘之主'],
    name: '克莱恩·莫雷蒂',
    openingIdentity: '廷根市的年轻职员，卷入神秘学与序列途径',
    openingFaction: '值夜者、黑荆棘安保公司与廷根本地关系',
    openingLocation: '廷根市相关街区或值夜者据点',
  },
  {
    aliases: ['遮天'],
    name: '叶凡',
    openingIdentity: '现代青年，被九龙拉棺带入宏大神话世界',
    openingFaction: '同学群体、荒古禁地和修行势力边缘',
    openingLocation: '泰山异变后可衔接的未知古地',
  },
  {
    aliases: ['雪中悍刀行'],
    name: '徐凤年',
    openingIdentity: '北椋世子，处在庙堂江湖和边关权力交错中',
    openingFaction: '北椋王府',
    openingLocation: '北椋王府、陵州或游历归途',
  },
  {
    aliases: ['斗破苍穹'],
    name: '萧炎',
    openingIdentity: '乌坦城萧家少年，斗气跌落后重新寻找成长契机',
    openingFaction: '萧家',
    openingLocation: '乌坦城萧家',
  },
  {
    aliases: ['吞噬星空'],
    name: '罗峰',
    openingIdentity: '基地市高中生，处在武者成长前夜',
    openingFaction: '基地市家庭、武馆与准武者圈层',
    openingLocation: '基地市、武馆或校园附近',
  },
];

export async function generateScenarioWithAI(config: AIProviderConfig, payload: HostScenarioGeneratePayload): Promise<HostScenarioGenerateResult> {
  if (!config.apiKey || config.apiKey === 'YOUR_API_KEY')
    return { success: false, message: 'AI 开局生成需要先配置模型 API Key。' };

  try {
    const result = await chatWithAI(
      { ...config, maxTokens: 1500, temperature: 0.5, systemPrompt: createScenarioSystemPrompt() },
      { messages: [], userMessage: createScenarioUserPrompt(payload) },
    );
    if (!result.success)
      return { success: false, message: `AI 开局生成失败：${result.error ?? '未知错误'}` };

    const seed = scenarioSeedSchema.parse(JSON.parse(extractJsonObject(result.reply)));
    assertScenarioSeedMatchesReference(seed, payload.referenceNovel);

    return { success: true, data: normalizeScenarioSeed(seed) };
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
2. 初始场景、NPC、人物属性、道具、能力/技能和快捷指令必须彼此一致，适合玩家第一回合行动。
3. 不要让玩家开局过强；道具和能力/技能必须服务半开放探索。
4. scenes 固定 3 个：初始场景和 2 个可前往场景；NPC 固定 2 到 3 个，location 必须是 scenes 中的场景名。
5. openingMessage 写给玩家，200 字以内。
6. attributes 3 到 5 个，必须根据参考小说和玩家开局身体/身份命名，不能只按题材模板命名；如果属性对应内部生命、行动能量、进度槽，分别写 statKey 为 hp、mp、exp。
7. inventory 3 到 5 个，skills 1 到 3 个，quickActions 4 到 6 个。
8. player.name 必须优先使用参考小说明确主角或第一视角人物；参考小说有明确主角时，不要原创玩家姓名。
9. player.realm、player.sect、player.location、attributes、inventory、skills 和 scenes 必须围绕该主角开局处境推导；UI 主题 ID 只影响界面风格，游戏题材 ID 只用于分类，不得替代小说背景判断。
JSON 结构：
{"title":"剧本名","description":"剧本设定","stylePrompt":"给叙事 AI 的风格约束","openingMessage":"开局描述","player":{"name":"主角姓名","realm":"境界/身份","sect":"势力","location":"初始场景名"},"attributes":[{"key":"vitality","label":"生命体征","value":80,"max":80,"statKey":"hp","description":"身体承受能力"},{"key":"focus","label":"精神稳定","value":70,"max":100,"statKey":"mp"},{"key":"progress","label":"剧情进展","value":0,"max":100,"statKey":"exp"}],"initialSceneName":"初始场景名","scenes":[{"name":"场景名","type":"town","region":"区域","description":"描述","connectedScenes":["其他场景"],"npcs":["npc_id"],"availableResources":["资源"],"isDangerous":false}],"npcs":[{"id":"npc_id","name":"NPC名","role":"story","location":"场景名","realm":"境界/身份","sect":"势力","favorability":0,"attackable":false,"description":"描述"}],"inventory":[{"name":"物品","count":1,"type":"misc","rarity":"common","description":"用途","usable":false}],"skills":[{"name":"能力","level":"入门","type":"support","proficiency":0,"source":"来源"}],"quickActions":["观察四周","询问身份","前往某地","整理背包"]}`;
}

export function createScenarioUserPrompt(payload: HostScenarioGeneratePayload): string {
  return `参考小说：${payload.referenceNovel}
作者：${payload.author ?? '未知'}
参考描述：${payload.description ?? '无'}
游戏题材 ID：${payload.gameTypeId}
UI 主题 ID：${payload.themeId}
参考主角约束：${createReferenceProtagonistInstruction(payload)}
难度：${payload.difficulty}
请生成一个可直接进入游戏的开局 seed。`;
}

function createReferenceProtagonistInstruction(payload: HostScenarioGeneratePayload): string {
  const hint = resolveReferenceProtagonistHint(payload.referenceNovel);
  if (!hint) {
    return '请根据参考小说标题、作者和描述识别明确主角或第一视角人物，player.name 必须优先使用该人物；只有参考信息无法判断时才用“玩家”占位，不要随机原创姓名。不要根据 UI 主题 ID 或题材 ID 改写玩家身份。';
  }

  return `已知主角/核心视角人物是“${hint.name}”，player.name 必须使用这个名字；player.realm、player.sect、player.location、attributes、inventory、skills、initialSceneName 和 scenes 必须围绕该角色的开局处境推导。参考身份：${hint.openingIdentity}；参考势力/关系：${hint.openingFaction}；参考开局位置：${hint.openingLocation}。不要根据 UI 主题 ID 或题材 ID 改写玩家身份。`;
}

function resolveReferenceProtagonistHint(referenceNovel: string): ReferenceProtagonistHint | undefined {
  const referenceText = referenceNovel.toLocaleLowerCase('zh-CN');
  return referenceProtagonistHints.find(hint => hint.aliases.some(alias => referenceText.includes(alias.toLocaleLowerCase('zh-CN'))));
}

function assertScenarioSeedMatchesReference(seed: z.infer<typeof scenarioSeedSchema>, referenceNovel: string): void {
  const hint = resolveReferenceProtagonistHint(referenceNovel);
  if (hint && !seed.player.name.includes(hint.name))
    throw new Error(`参考小说《${referenceNovel}》的玩家姓名必须使用主角“${hint.name}”，当前返回为“${seed.player.name}”。`);
}

function extractJsonObject(text: string): string {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex < 0 || endIndex < startIndex)
    throw new Error('AI 开局生成未返回 JSON 对象');
  return text.slice(startIndex, endIndex + 1);
}
