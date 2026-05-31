import type { Scene } from '@xianxia-rpg/core';
import type { GameState } from './game-state';
import type { ChatMessage, InventoryItem, InventoryViewItem, Role, Skill } from './types';
import { STARTER_SCENES } from '@xianxia-rpg/core';
import { createDefaultScenarioPack, normalizeScenarioPack } from './scenario';
import type { ScenarioPack } from './scenario';
import { normalizeThemeId, normalizeThemeSource } from './theme';

export const pinnedItems = ['下品灵石', '黄龙丹', '长剑'];

export const itemDescriptions: Record<string, string> = {
  黄龙丹: '恢复50点气血的初级丹药',
  回灵丹: '恢复30点灵力的丹药',
  筑基丹: '突破至筑基期所需的珍贵丹药',
  结丹丸: '结丹期修士修炼辅助丹药',
  下品灵石: '修仙界通用货币，可用于购买物品',
  中品灵石: '等价100下品灵石，高阶交易货币',
  上品灵石: '等价100中品灵石，极为珍贵',
  长剑: '普通铁剑，攻击力+5',
  飞剑: '法器级飞剑，可御剑飞行',
  护身符: '一次性防御道具，抵挡一次致命攻击',
  储物袋: '可存储物品的空间法器',
  灵草: '炼丹基础材料',
  铁精: '炼器基础材料',
  妖兽内丹: '妖兽体内的精华结晶，炼丹珍贵材料',
};

export const itemIcons: Record<string, string> = {
  黄龙丹: '丹',
  回灵丹: '丹',
  筑基丹: '筑',
  结丹丸: '结',
  下品灵石: '石',
  中品灵石: '石',
  上品灵石: '石',
  长剑: '剑',
  飞剑: '剑',
  护身符: '符',
  储物袋: '袋',
  灵草: '草',
  铁精: '矿',
  妖兽内丹: '丹',
};

export const cultivationRealms = [
  '凡人',
  '炼气期一层',
  '炼气期二层',
  '炼气期三层',
  '炼气期四层',
  '炼气期五层',
  '炼气期六层',
  '炼气期七层',
  '炼气期八层',
  '炼气期九层',
  '炼气期十层',
  '炼气期十一层',
  '炼气期十二层',
  '炼气期十三层',
  '筑基期初期',
  '筑基期中期',
  '筑基期后期',
  '结丹期初期',
  '结丹期中期',
  '结丹期后期',
  '元婴期初期',
  '元婴期中期',
  '元婴期后期',
  '化神期初期',
  '化神期中期',
  '化神期后期',
  '炼虚期初期',
  '炼虚期中期',
  '炼虚期后期',
  '合体期初期',
  '合体期中期',
  '合体期后期',
  '大乘期初期',
  '大乘期中期',
  '大乘期后期',
  '渡劫期',
  '真仙境',
] as const;

export type CultivationRealm = typeof cultivationRealms[number];

export const realmAliases: Record<string, CultivationRealm> = {
  筑基期: '筑基期初期',
  结丹期: '结丹期初期',
  元婴期: '元婴期初期',
  化神期: '化神期初期',
  炼虚期: '炼虚期初期',
  合体期: '合体期初期',
  大乘期: '大乘期初期',
};

export const realmLevels: Record<string, number> = createRealmLevels();

export const resourceRealmReq: Record<string, string> = {
  筑基丹: '炼气期十三层',
  结丹丸: '筑基期后期',
  飞剑: '炼气期七层',
  中品灵石: '筑基期初期',
  上品灵石: '结丹期初期',
  护身符: '炼气期三层',
  妖兽内丹: '筑基期后期',
};

export const skillRealmReq: Record<string, string> = {
  青元剑诀: '炼气期七层',
  大衍诀: '筑基期初期',
  玄阴经: '筑基期中期',
  三转重元功: '结丹期初期',
  元磁神光: '元婴期后期',
};

export function resolveRealmName(realm: string): string {
  return realmAliases[realm] ?? realm;
}

export function getRealmLevel(realm: string): number {
  return realmLevels[resolveRealmName(realm)] ?? 0;
}

export function getNextRealm(realm: string): string | null {
  const resolvedRealm = resolveRealmName(realm);
  const index = cultivationRealms.findIndex(item => item === resolvedRealm);
  if (index === -1 || index >= cultivationRealms.length - 1)
    return null;
  return cultivationRealms[index + 1];
}

export function getRealmMaxExp(realm: string): number {
  const level = Math.max(1, getRealmLevel(realm));
  return Math.round(100 * level ** 1.35);
}

function createRealmLevels(): Record<string, number> {
  const levels: Record<string, number> = {
    凡兽: 0,
    一阶妖兽: 4,
    二阶妖兽: 8,
    三阶妖兽: 12,
    四阶妖兽: 16,
    五阶妖兽: 20,
    六阶妖兽: 24,
    七阶妖兽: 28,
    八阶妖兽: 32,
    九阶妖兽: 36,
    十阶妖兽: 40,
  };
  cultivationRealms.forEach((realm, index) => {
    levels[realm] = index;
  });
  for (const [alias, realm] of Object.entries(realmAliases)) {
    levels[alias] = levels[realm];
  }
  return levels;
}

export function createRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getTimeStr(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function createMessage(role: Role, content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, time: getTimeStr() };
}

export function getItemIcon(name: string): string {
  return itemIcons[name] ?? '物';
}

export function getInventoryItemKey(item: InventoryItem): string {
  return item.name;
}

export function createInventoryViewItems(items: InventoryItem[], pinnedKeys: string[]): InventoryViewItem[] {
  const pinnedSet = new Set(pinnedKeys);
  return items
    .map((item, index) => {
      const key = getInventoryItemKey(item);
      return { key, item, index, pinned: pinnedSet.has(key) };
    })
    .sort((left, right) => Number(right.pinned) - Number(left.pinned));
}

export function createInitialGameState(): GameState {
  return createGameStateFromScenario(createDefaultScenarioPack());
}

export function createGameStateFromScenario(scenario: ScenarioPack): GameState {
  return {
    runId: createRunId(),
    scenario,
    character: structuredClone(scenario.player),
    stats: createInitialStats(scenario.player.realm),
    inventory: createScenarioInventory(scenario),
    skills: createScenarioSkills(scenario),
    chatHistory: [],
    difficulty: 'normal',
    themeId: scenario.themeId,
    themeSource: scenario.themeSource,
    isDead: false,
    currentScene: scenario.initialSceneName,
    scenes: createScenarioScenes(scenario),
    npcs: {},
    defeatedNpcs: [],
  };
}

export function cloneInitialState(): GameState {
  return createInitialGameState();
}

export function cloneScenarioInitialState(scenario: ScenarioPack): GameState {
  return createGameStateFromScenario(scenario);
}

export function getDefaultQuickActions(gameState: GameState): string[] {
  const scene = getEffectiveScene(gameState.currentScene, gameState.scenes[gameState.currentScene]);
  const actions = getSceneSpecificActions(gameState.currentScene);

  if (scene?.connectedScenes.length) {
    actions.push(...scene.connectedScenes.slice(0, 4).map(name => `前往${name}`));
  }

  if (scene?.isDangerous) {
    actions.push('谨慎探查', '准备战斗');
  }
  else {
    actions.push('寻找机缘');
  }

  return Array.from(new Set(actions)).slice(0, 8);
}

export function mergeQuickActions(gameState: GameState, aiActions: string[]): string[] {
  return Array.from(new Set([...aiActions, ...getDefaultQuickActions(gameState)])).slice(0, 8);
}

function getEffectiveScene(sceneName: string, scene: Scene | undefined): Scene | undefined {
  const starterScene = STARTER_SCENES[sceneName];
  if (starterScene && scene)
    return mergeScene(starterScene, scene);
  return scene ?? starterScene;
}

function getSceneSpecificActions(sceneName: string): string[] {
  if (sceneName === '练功房')
    return ['修炼长春功', '演练基础剑术', '调息恢复', '查看状态'];
  if (sceneName === '后山')
    return ['采集灵草', '探查山林', '寻找妖兽踪迹', '返回居所'];
  if (sceneName === '丹药房')
    return ['兑换丹药', '询问药价', '服用黄龙丹', '返回居所'];
  if (sceneName === '藏经阁')
    return ['查阅功法', '寻找游记', '研究地图', '返回居所'];
  return ['观察四周', '整理背包', '查看状态', '外出历练'];
}

export function normalizeLoadedGameState(data: unknown): GameState | null {
  if (!data || typeof data !== 'object')
    return null;
  const loaded = data as Partial<GameState>;
  const scenario = normalizeScenarioPack(loaded.scenario) ?? createDefaultScenarioPack();
  const fallback = createGameStateFromScenario(scenario);
  return {
    ...fallback,
    ...loaded,
    scenario,
    runId: loaded.runId ?? fallback.runId,
    character: { ...fallback.character, ...loaded.character },
    stats: { ...fallback.stats, ...loaded.stats },
    inventory: Array.isArray(loaded.inventory) ? loaded.inventory : fallback.inventory,
    skills: Array.isArray(loaded.skills) ? loaded.skills : fallback.skills,
    chatHistory: Array.isArray(loaded.chatHistory) ? loaded.chatHistory : fallback.chatHistory,
    themeId: normalizeThemeId(loaded.themeId ?? scenario.themeId),
    themeSource: normalizeThemeSource(loaded.themeSource ?? scenario.themeSource),
    scenes: mergeLoadedScenes(fallback.scenes, loaded.scenes),
    npcs: loaded.npcs ?? fallback.npcs,
    defeatedNpcs: Array.isArray(loaded.defeatedNpcs) ? loaded.defeatedNpcs : fallback.defeatedNpcs,
  };
}

function createInitialStats(realm: string): GameState['stats'] {
  const realmLevel = getRealmLevel(realm);
  return {
    hp: Math.max(80, 80 + realmLevel * 20),
    maxHp: Math.max(80, 80 + realmLevel * 20),
    mp: Math.max(80, 80 + realmLevel * 24),
    maxMp: Math.max(100, 80 + realmLevel * 24),
    exp: realm === '凡人' ? 0 : 10,
    maxExp: getRealmMaxExp(realm),
  };
}

function createScenarioInventory(scenario: ScenarioPack): InventoryItem[] {
  if (scenario.id === 'fanren-xiuxian') {
    return [
      { id: 'item_huanglongdan', name: '黄龙丹', count: 3, type: 'pill', rarity: 'low', usable: true, description: itemDescriptions.黄龙丹 },
      { id: 'item_low_spirit_stone', name: '下品灵石', count: 50, type: 'spirit_stone', rarity: 'low', description: itemDescriptions.下品灵石 },
      { id: 'item_iron_sword', name: '长剑', count: 1, type: 'weapon', rarity: 'common', usable: true, description: itemDescriptions.长剑 },
    ];
  }
  return [
    { id: 'item_travel_pack', name: '随身行囊', count: 1, type: 'misc', rarity: 'common', description: '进入新剧本时随身携带的基础物品。' },
  ];
}

function createScenarioSkills(scenario: ScenarioPack): Skill[] {
  if (scenario.id === 'fanren-xiuxian') {
    return [
      { id: 'skill_changchun', name: '长春功', level: '入门', type: 'main', proficiency: 0, source: '七玄门' },
      { id: 'skill_basic_sword', name: '基础剑术', level: '熟练', type: 'combat', proficiency: 20, source: '七玄门' },
    ];
  }
  return [];
}

function createScenarioScenes(scenario: ScenarioPack): Record<string, Scene> {
  const scenes: Record<string, Scene> = {};
  for (const [name, scene] of Object.entries(scenario.scenes)) {
    scenes[name] = structuredClone(scene);
  }
  return scenes;
}

function mergeLoadedScenes(fallbackScenes: Record<string, Scene>, loadedScenes: unknown): Record<string, Scene> {
  if (!loadedScenes || typeof loadedScenes !== 'object')
    return fallbackScenes;

  const scenes = structuredClone(fallbackScenes);
  for (const [name, loadedScene] of Object.entries(loadedScenes as Record<string, Partial<Scene>>)) {
    const fallbackScene = fallbackScenes[name];
    scenes[name] = fallbackScene ? mergeScene(fallbackScene, loadedScene) : loadedScene as Scene;
  }
  return scenes;
}

function mergeScene(fallbackScene: Scene, loadedScene: Partial<Scene>): Scene {
  return {
    ...fallbackScene,
    ...loadedScene,
    description: loadedScene.description || fallbackScene.description,
    connectedScenes: mergeTextItems(fallbackScene.connectedScenes, loadedScene.connectedScenes ?? []),
    availableResources: loadedScene.availableResources?.length ? loadedScene.availableResources : fallbackScene.availableResources,
    npcs: mergeTextItems(fallbackScene.npcs, loadedScene.npcs ?? []),
  };
}

function mergeTextItems(primary: string[], secondary: string[]): string[] {
  return Array.from(new Set([...primary, ...secondary]));
}

export function statPercent(value: number, max: number): string {
  if (max <= 0)
    return '0%';
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}
