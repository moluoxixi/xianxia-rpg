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
  /** 最低阶段要求（空表示无限制，具体含义由剧本题材决定） */
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
  /** 阶段/身份层级 */
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
  /** 可传授的能力（仅 mentor） */
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
  /** 最低阶段要求 */
  minRealm?: string;
  /** 基础价值，具体货币单位由剧本决定。 */
  value?: number;
}
