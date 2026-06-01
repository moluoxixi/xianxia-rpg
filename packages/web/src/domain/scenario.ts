import type { NovelSummary, NPC, Scene } from '@xianxia-rpg/core';
import type { CharacterAttribute, CharacterInfo, InventoryItem, Skill } from './types';
import { DEFAULT_GAME_TYPE_ID, inferGameTypeFromNovel, normalizeGameTypeId } from './game-type';
import type { GameTypeId } from './game-type';
import { DEFAULT_THEME_ID, inferThemeIdFromNovel, normalizeThemeId, normalizeThemeSource } from './theme';
import type { GameThemeId, GameThemeSource } from './theme';

export interface ScenarioPack {
  id: string;
  title: string;
  referenceNovel: string;
  description: string;
  stylePrompt: string;
  openingMessage: string;
  gameTypeId: GameTypeId;
  themeId: GameThemeId;
  themeSource: GameThemeSource;
  initialAttributes?: CharacterAttribute[];
  initialInventory?: InventoryItem[];
  initialSkills?: Skill[];
  initialNpcs?: NPC[];
  initialQuickActions?: string[];
  player: CharacterInfo;
  initialSceneName: string;
  scenes: Record<string, Scene>;
}

export interface ScenarioGenerationSeed {
  title: string;
  description: string;
  stylePrompt: string;
  openingMessage: string;
  player: CharacterInfo;
  attributes: CharacterAttribute[];
  initialSceneName: string;
  scenes: Scene[];
  npcs: NPC[];
  inventory: InventoryItem[];
  skills: Skill[];
  quickActions: string[];
}

export interface NovelScenarioOption {
  id: string;
  title: string;
  referenceNovel: string;
  author: string;
  description: string;
}

const removedBuiltinNovelTitle = ['凡人', '修仙', '传'].join('');

// 主菜单只暴露可选剧本清单，自定义小说来源由小说 API tab 接入并写入同一契约。
export const availableNovelScenarios: NovelScenarioOption[] = [
  {
    id: 'lord-of-mysteries',
    title: '诡秘之主',
    referenceNovel: '诡秘之主',
    author: '爱潜水的乌贼',
    description: '维多利亚神秘学、序列晋升、隐秘组织与不可名状风险。',
  },
  {
    id: 'shrouding-the-heavens',
    title: '遮天',
    referenceNovel: '遮天',
    author: '辰东',
    description: '宏大古史、圣地世家、体质秘境和星空远行。',
  },
  {
    id: 'snow-sword-stride',
    title: '雪中悍刀行',
    referenceNovel: '雪中悍刀行',
    author: '烽火戏诸侯',
    description: '庙堂江湖、门阀边关、武道气运与人情抉择。',
  },
  {
    id: 'battle-through-the-heavens',
    title: '斗破苍穹',
    referenceNovel: '斗破苍穹',
    author: '天蚕土豆',
    description: '斗气大陆、炼药成长、宗门家族与异火机缘。',
  },
  {
    id: 'swallowed-star',
    title: '吞噬星空',
    referenceNovel: '吞噬星空',
    author: '我吃西红柿',
    description: '高武科幻、怪兽荒野、行星级成长和宇宙冒险。',
  },
];

export function createRecommendedNovelSummaries(): NovelSummary[] {
  return availableNovelScenarios.map(novel => ({
    id: `recommended-${novel.id}`,
    title: novel.referenceNovel,
    author: novel.author,
    description: novel.description,
    source: '推荐小说',
  }));
}

export function mergeNovelSummaries(...groups: NovelSummary[][]): NovelSummary[] {
  const merged = new Map<string, NovelSummary>();
  for (const group of groups) {
    for (const novel of group) {
      if (isRemovedBuiltinNovel(novel.title))
        continue;
      const key = novel.title.toLocaleLowerCase('zh-CN');
      if (!merged.has(key))
        merged.set(key, novel);
    }
  }
  return [...merged.values()];
}

function isRemovedBuiltinNovel(title: string): boolean {
  return title.includes(removedBuiltinNovelTitle);
}

export function createDefaultScenarioPack(): ScenarioPack {
  const sceneName = '未开始';
  return {
    id: 'unselected-scenario',
    title: '未选择剧本',
    referenceNovel: '',
    description: '玩家尚未选择参考小说。该占位剧本只用于主菜单和清空存档后的运行态，不参与正式开局。',
    stylePrompt: '等待玩家选择参考小说并由 AI 生成正式开局。',
    openingMessage: '请选择新开游戏或读取存档。',
    gameTypeId: DEFAULT_GAME_TYPE_ID,
    themeId: DEFAULT_THEME_ID,
    themeSource: 'default',
    initialAttributes: [
      { key: 'hp', label: '状态', value: 80, max: 80, statKey: 'hp' },
      { key: 'mp', label: '行动力', value: 80, max: 100, statKey: 'mp' },
      { key: 'exp', label: '进展', value: 0, max: 100, statKey: 'exp' },
    ],
    player: { name: '玩家', realm: '未定身份', sect: '未定', location: sceneName },
    initialSceneName: sceneName,
    scenes: {
      [sceneName]: {
        name: sceneName,
        type: 'residence',
        region: '未定',
        description: '尚未进入正式剧本。',
        connectedScenes: [],
        npcs: [],
        availableResources: [],
        isDangerous: false,
      },
    },
  };
}

export function createScenarioFromNovelTitle(novelTitle: string, themeId: GameThemeId = inferThemeIdFromNovel(novelTitle), themeSource: GameThemeSource = 'novel-auto', gameTypeId: GameTypeId = inferGameTypeFromNovel(novelTitle), seed?: ScenarioGenerationSeed): ScenarioPack {
  const title = novelTitle;
  if (seed)
    return createScenarioFromSeed(title, themeId, themeSource, gameTypeId, seed);

  const sceneName = `${title}开篇之地`;
  return {
    id: `novel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    referenceNovel: title,
    description: `以《${title}》为参考生成的自由剧本。系统会先抽象作品气质、力量体系、势力关系和开篇矛盾，再推进玩家自己的故事。`,
    stylePrompt: `参考《${title}》的题材气质、世界规则、人物关系和叙事节奏。不要直接复述原文，不要强行复刻主线；以玩家当前身份为中心生成新的可交互剧情，并保持世界规则一致。`,
    openingMessage: `你选择以《${title}》作为剧本参考。\n\n系统会围绕这部小说的世界气质生成一条新的半开放式故事线。你可以先观察环境、确认身份、接触人物，或者主动探索当前世界。`,
    gameTypeId,
    themeId,
    themeSource,
    initialAttributes: [
      { key: 'hp', label: '状态', value: 80, max: 80, statKey: 'hp' },
      { key: 'mp', label: '行动力', value: 80, max: 100, statKey: 'mp' },
      { key: 'exp', label: '进展', value: 0, max: 100, statKey: 'exp' },
    ],
    player: { name: '玩家', realm: '未定身份', sect: '未定', location: sceneName },
    initialSceneName: sceneName,
    scenes: {
      [sceneName]: {
        name: sceneName,
        type: 'town',
        region: title,
        description: `围绕《${title}》生成的开篇场景，具体势力、人物和冲突将由 AI 根据剧本参考逐步补全。`,
        connectedScenes: [],
        npcs: [],
        availableResources: ['线索', '人脉', '身份信息'],
        isDangerous: false,
      },
    },
  };
}

function createScenarioFromSeed(referenceNovel: string, themeId: GameThemeId, themeSource: GameThemeSource, gameTypeId: GameTypeId, seed: ScenarioGenerationSeed): ScenarioPack {
  const scenes = Object.fromEntries(seed.scenes.map(scene => [scene.name, { ...scene, npcs: [...scene.npcs] }]));
  for (const npc of seed.npcs) {
    const scene = scenes[npc.location];
    if (scene && !scene.npcs.includes(npc.id))
      scene.npcs.push(npc.id);
  }

  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: seed.title,
    referenceNovel,
    description: seed.description,
    stylePrompt: seed.stylePrompt,
    openingMessage: seed.openingMessage,
    gameTypeId,
    themeId,
    themeSource,
    initialAttributes: seed.attributes,
    initialInventory: seed.inventory,
    initialSkills: seed.skills,
    initialNpcs: seed.npcs,
    initialQuickActions: seed.quickActions,
    player: seed.player,
    initialSceneName: seed.initialSceneName,
    scenes,
  };
}

export function normalizeScenarioPack(value: unknown): ScenarioPack | null {
  if (!value || typeof value !== 'object')
    return null;
  const scenario = value as ScenarioPack;
  return {
    ...scenario,
    gameTypeId: normalizeGameTypeId(scenario.gameTypeId),
    themeId: normalizeThemeId(scenario.themeId),
    themeSource: normalizeThemeSource(scenario.themeSource),
  };
}
