import type { GameState } from './game-state';
import type { ChatMessage, InventoryItem, InventoryViewItem, Role } from './types';
import { INITIAL_SCENE } from '@xianxia-rpg/shared';

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

export const realmLevels: Record<string, number> = {
  凡兽: 0,
  一阶妖兽: 1,
  二阶妖兽: 2,
  三阶妖兽: 3,
  炼气期一层: 1,
  炼气期二层: 2,
  炼气期三层: 3,
  炼气期四层: 4,
  炼气期五层: 5,
  炼气期六层: 6,
  炼气期七层: 7,
  炼气期八层: 8,
  炼气期九层: 9,
  筑基期: 10,
  结丹期: 15,
  元婴期: 20,
};

export const resourceRealmReq: Record<string, string> = {
  筑基丹: '炼气期九层',
  结丹丸: '筑基期',
  飞剑: '炼气期五层',
  中品灵石: '炼气期三层',
  上品灵石: '筑基期',
  护身符: '炼气期二层',
};

export const skillRealmReq: Record<string, string> = {
  青元剑诀: '炼气期七层',
  大衍诀: '筑基期',
  玄阴经: '筑基期',
  三转重元功: '结丹期',
  元磁神光: '元婴期',
};

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
  return {
    runId: createRunId(),
    character: { name: '韩立', realm: '炼气期一层', sect: '七玄门', location: INITIAL_SCENE.name },
    stats: { hp: 100, maxHp: 100, mp: 80, maxMp: 100, exp: 10, maxExp: 100 },
    inventory: [
      { id: 'item_huanglongdan', name: '黄龙丹', count: 3, type: 'pill', rarity: 'low', usable: true, description: itemDescriptions.黄龙丹 },
      { id: 'item_low_spirit_stone', name: '下品灵石', count: 50, type: 'spirit_stone', rarity: 'low', description: itemDescriptions.下品灵石 },
      { id: 'item_iron_sword', name: '长剑', count: 1, type: 'weapon', rarity: 'common', usable: true, description: itemDescriptions.长剑 },
    ],
    skills: [
      { id: 'skill_changchun', name: '长春功', level: '入门', type: 'main', proficiency: 0, source: '七玄门' },
      { id: 'skill_basic_sword', name: '基础剑术', level: '熟练', type: 'combat', proficiency: 20, source: '七玄门' },
    ],
    chatHistory: [],
    difficulty: 'normal',
    isDead: false,
    currentScene: INITIAL_SCENE.name,
    scenes: { [INITIAL_SCENE.name]: INITIAL_SCENE },
    npcs: {},
    defeatedNpcs: [],
  };
}

export function cloneInitialState(): GameState {
  return createInitialGameState();
}

export function getDefaultQuickActions(gameState: GameState): string[] {
  const scene = gameState.scenes[gameState.currentScene];
  const actions = ['观察四周', '修炼功法', '整理背包'];

  if (scene?.connectedScenes.length) {
    actions.push(...scene.connectedScenes.slice(0, 3).map(name => `前往${name}`));
  }

  if (scene?.isDangerous) {
    actions.push('谨慎探查', '准备战斗');
  }
  else {
    actions.push('寻找机缘');
  }

  return Array.from(new Set(actions)).slice(0, 8);
}

export function normalizeLoadedGameState(data: unknown): GameState | null {
  if (!data || typeof data !== 'object')
    return null;
  const loaded = data as Partial<GameState>;
  const fallback = createInitialGameState();
  return {
    ...fallback,
    ...loaded,
    runId: loaded.runId ?? fallback.runId,
    character: { ...fallback.character, ...loaded.character },
    stats: { ...fallback.stats, ...loaded.stats },
    inventory: Array.isArray(loaded.inventory) ? loaded.inventory : fallback.inventory,
    skills: Array.isArray(loaded.skills) ? loaded.skills : fallback.skills,
    chatHistory: Array.isArray(loaded.chatHistory) ? loaded.chatHistory : fallback.chatHistory,
    scenes: loaded.scenes ?? fallback.scenes,
    npcs: loaded.npcs ?? fallback.npcs,
    defeatedNpcs: Array.isArray(loaded.defeatedNpcs) ? loaded.defeatedNpcs : fallback.defeatedNpcs,
  };
}

export function statPercent(value: number, max: number): string {
  if (max <= 0)
    return '0%';
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}
