// ========== 场景系统类型定义 ==========

/** 场景类型 */
export type SceneType = 'sect' | 'town' | 'wild' | 'dungeon' | 'shop' | 'residence';

/** 场景定义 */
export interface Scene {
  /** 场景名称 */
  name: string;
  /** 场景类型 */
  type: SceneType;
  /** 所属区域/势力 */
  region: string;
  /** 最低境界要求（空表示无限制） */
  minRealm?: string;
  /** 场景描述 */
  description: string;
  /** 关联场景（可直达的场景列表） */
  connectedScenes: string[];
  /** 场景内的 NPC ID 列表 */
  npcs: string[];
  /** 场景可产出的物资类型 */
  availableResources: string[];
  /** 是否危险区域 */
  isDangerous: boolean;
}

/** NPC 类型 */
export type NPCRole = 'story' | 'enemy' | 'merchant' | 'mentor' | 'boss';

/** NPC 定义 */
export interface NPC {
  /** NPC ID */
  id: string;
  /** NPC 名称 */
  name: string;
  /** NPC 角色 */
  role: NPCRole;
  /** 所在场景 */
  location: string;
  /** 境界 */
  realm: string;
  /** 所属势力 */
  sect?: string;
  /** 好感度 -100~100 */
  favorability: number;
  /** 是否可被攻击 */
  attackable: boolean;
  /** NPC 描述 */
  description: string;
  /** 战斗属性（仅 enemy/boss/attackable 的 story NPC） */
  combat?: {
    attack: number;
    defense: number;
    hp: number;
    maxHp: number;
    skills?: string[];
  };
  /** 商店物品（仅 merchant） */
  shopItems?: Array<{ name: string; price: number }>;
  /** 可传授的功法（仅 mentor） */
  teachings?: string[];
}

/** 物资类型 */
export type ResourceType = 'pill' | 'spirit_stone' | 'material' | 'artifact' | 'technique';

/** 物资定义 */
export interface Resource {
  /** 物资名称 */
  name: string;
  /** 物资类型 */
  type: ResourceType;
  /** 描述 */
  description: string;
  /** 使用效果 */
  effect?: string;
  /** 最低境界要求 */
  minRealm?: string;
  /** 价值（下品灵石） */
  value?: number;
}

/** 初始场景模板（七玄门初期） */
export const INITIAL_SCENE: Scene = {
  name: '七玄门外门居所',
  type: 'residence',
  region: '七玄门',
  description: '七玄门外门弟子的居所，简陋的草棚，月光透过破屋梁洒下。',
  connectedScenes: ['练功房', '后山', '丹药房', '藏经阁'],
  npcs: [],
  availableResources: [],
  isDangerous: false,
};

/** 七玄门开局区域，作为半开放玩法的基础场景记录。 */
export const STARTER_SCENES: Record<string, Scene> = {
  [INITIAL_SCENE.name]: INITIAL_SCENE,
  练功房: {
    name: '练功房',
    type: 'sect',
    region: '七玄门',
    description: '外门弟子打坐练气的石室，聚气阵缓慢牵引灵气，适合修炼基础功法与演练剑术。',
    connectedScenes: [INITIAL_SCENE.name, '后山', '丹药房', '藏经阁'],
    npcs: [],
    availableResources: ['修为', '功法熟练度'],
    isDangerous: false,
  },
  后山: {
    name: '后山',
    type: 'wild',
    region: '七玄门',
    description: '七玄门后方的山林，草木深密，偶有野兽与低阶灵草，是外门弟子历练采药之处。',
    connectedScenes: [INITIAL_SCENE.name, '练功房'],
    npcs: [],
    availableResources: ['灵草', '铁精', '野兽材料'],
    isDangerous: true,
  },
  丹药房: {
    name: '丹药房',
    type: 'shop',
    region: '七玄门',
    description: '门内发放与兑换基础丹药的地方，空气里浮着淡淡药香。',
    connectedScenes: [INITIAL_SCENE.name, '练功房', '藏经阁'],
    npcs: [],
    availableResources: ['黄龙丹', '回灵丹'],
    isDangerous: false,
  },
  藏经阁: {
    name: '藏经阁',
    type: 'sect',
    region: '七玄门',
    description: '收藏外门基础功法与游记札录的阁楼，适合查阅世界线索和功法常识。',
    connectedScenes: [INITIAL_SCENE.name, '练功房', '丹药房'],
    npcs: [],
    availableResources: ['基础功法', '宗门情报'],
    isDangerous: false,
  },
};
