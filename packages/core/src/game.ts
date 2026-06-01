// ========== 游戏核心类型定义 ==========

/** 游戏难度 */
export type GameDifficulty = 'normal' | 'hard';

/** 游戏状态标记 */
export type GameStatus = 'playing' | 'dead' | 'breakthrough';

/** 难度配置 */
export interface DifficultyConfig {
  /** 难度类型 */
  difficulty: GameDifficulty;
  /** 难度名称 */
  name: string;
  /** 难度描述 */
  description: string;
  /** 是否允许存档 */
  canSave: boolean;
  /** 死亡后是否可以复活 */
  canRevive: boolean;
  /** 复活消耗，具体道具和数量由剧本规则决定。 */
  reviveCost?: number;
  /** 战斗伤害倍率 */
  damageMultiplier: number;
  /** 资源掉落倍率 */
  lootMultiplier: number;
}

/** 预设难度配置 */
export const DIFFICULTY_PRESETS: Record<GameDifficulty, DifficultyConfig> = {
  normal: {
    difficulty: 'normal',
    name: '简单模式',
    description: '可存档，满足剧本复苏条件时允许继续',
    canSave: true,
    canRevive: true,
    reviveCost: 20,
    damageMultiplier: 0.8,
    lootMultiplier: 1.2,
  },
  hard: {
    difficulty: 'hard',
    name: '困难模式',
    description: '硬核模式，失败即永久结束，存档仅保留一个',
    canSave: true,
    canRevive: false,
    damageMultiplier: 1.5,
    lootMultiplier: 1.0,
  },
};
