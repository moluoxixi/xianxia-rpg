import type { NovelSummary, Scene } from '@xianxia-rpg/core';
import type { CharacterInfo } from './types';
import { INITIAL_SCENE, STARTER_SCENES } from '@xianxia-rpg/core';
import { inferThemeIdFromNovel, normalizeThemeId, normalizeThemeSource } from './theme';
import type { GameThemeId, GameThemeSource } from './theme';

export interface ScenarioPack {
  id: string;
  title: string;
  referenceNovel: string;
  description: string;
  stylePrompt: string;
  openingMessage: string;
  themeId: GameThemeId;
  themeSource: GameThemeSource;
  player: CharacterInfo;
  initialSceneName: string;
  scenes: Record<string, Scene>;
}

export interface NovelScenarioOption {
  id: string;
  title: string;
  referenceNovel: string;
  author: string;
  description: string;
}

// 主菜单只暴露可选剧本清单，自定义小说来源后续由小说 API tab 接入并写入同一契约。
export const availableNovelScenarios: NovelScenarioOption[] = [
  {
    id: 'fanren-xiuxian',
    title: '凡人修仙传',
    referenceNovel: '凡人修仙传',
    author: '忘语',
    description: '凡人流修仙，资源稀缺、谨慎成长、机缘与风险并存。',
  },
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
      const key = novel.title.toLocaleLowerCase('zh-CN');
      if (!merged.has(key))
        merged.set(key, novel);
    }
  }
  return [...merged.values()];
}

export function createDefaultScenarioPack(): ScenarioPack {
  return {
    id: 'fanren-xiuxian',
    title: '凡人流修仙',
    referenceNovel: '凡人修仙传',
    description: '以凡人流修仙为参考，强调资源稀缺、境界森严、成长缓慢和机缘风险并存。',
    stylePrompt: '参考凡人流修仙气质：谨慎、克制、因果清晰，避免无代价暴富和随意跳阶。不要复述原作正文，只生成可交互的半开放式剧情。',
    openingMessage: '欢迎来到修仙世界！你是一个出身贫寒的凡人，偶然间踏入修仙之门。\n\n当前你身处七玄门外门弟子居所，修为尚在炼气期一层。\n\n你可以选择与周围的人交谈、探索门派、修炼功法，或者外出历练。',
    themeId: 'xianxia',
    themeSource: 'novel-auto',
    player: { name: '韩立', realm: '炼气期一层', sect: '七玄门', location: INITIAL_SCENE.name },
    initialSceneName: INITIAL_SCENE.name,
    scenes: structuredClone(STARTER_SCENES),
  };
}

export function createScenarioFromNovelTitle(novelTitle: string, themeId: GameThemeId = inferThemeIdFromNovel(novelTitle), themeSource: GameThemeSource = 'novel-auto'): ScenarioPack {
  const title = novelTitle;
  if (title === '凡人修仙传') {
    return {
      ...createDefaultScenarioPack(),
      themeId,
      themeSource,
    };
  }

  const sceneName = `${title}开篇之地`;
  return {
    id: `novel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    referenceNovel: title,
    description: `以《${title}》为参考生成的自由剧本。系统会先抽象作品气质、力量体系、势力关系和开篇矛盾，再推进玩家自己的故事。`,
    stylePrompt: `参考《${title}》的题材气质、世界规则、人物关系和叙事节奏。不要直接复述原文，不要强行复刻主线；以玩家当前身份为中心生成新的可交互剧情，并保持世界规则一致。`,
    openingMessage: `你选择以《${title}》作为剧本参考。\n\n系统会围绕这部小说的世界气质生成一条新的半开放式故事线。你可以先观察环境、确认身份、接触人物，或者主动探索当前世界。`,
    themeId,
    themeSource,
    player: { name: '玩家', realm: '凡人', sect: '未定', location: sceneName },
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

export function normalizeScenarioPack(value: unknown): ScenarioPack | null {
  if (!value || typeof value !== 'object')
    return null;
  const scenario = value as ScenarioPack;
  const inferredThemeId = inferThemeIdFromNovel(scenario.referenceNovel ?? scenario.title, scenario.description);
  return {
    ...scenario,
    themeId: normalizeThemeId(scenario.themeId ?? inferredThemeId),
    themeSource: normalizeThemeSource(scenario.themeSource ?? 'novel-auto'),
  };
}
