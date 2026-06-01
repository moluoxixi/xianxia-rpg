import type { NPC, Scene } from '@xianxia-rpg/core';
import type { GameTypeId } from './game-type';
import type { ScenarioPack } from './scenario';
import type { GameThemeId, GameThemeSource } from './theme';
import type { CharacterAttribute, CharacterInfo, CharacterStats, Difficulty, InventoryItem, Skill, StatAttributeKey } from './types';

export interface GameState {
  runId: string;
  scenario: ScenarioPack;
  character: CharacterInfo;
  stats: CharacterStats;
  attributes: CharacterAttribute[];
  inventory: InventoryItem[];
  skills: Skill[];
  chatHistory: Array<{ role: string; content: string }>;
  difficulty: Difficulty;
  gameTypeId: GameTypeId;
  themeId: GameThemeId;
  themeSource: GameThemeSource;
  isDead: boolean;
  currentScene: string;
  scenes: Record<string, Scene>;
  npcs: Record<string, NPC>;
  defeatedNpcs: string[];
}

export interface ResourceChange {
  type:
    | 'item_add'
    | 'item_remove'
    | 'hp'
    | 'mp'
    | 'exp'
    | 'realm'
    | 'location'
    | 'skill_add'
    | 'skill_levelup'
    | 'combat'
    | 'attribute_update'
    | 'scene_define'
    | 'npc_add'
    | 'npc_update'
    | 'favorability';
  name?: string;
  count?: number;
  value?: string | number;
  attribute_key?: string;
  attribute_label?: string;
  attribute_value?: number;
  attribute_max?: number;
  attribute_delta?: number;
  attribute_stat_key?: StatAttributeKey;
  attribute_description?: string;
  level?: string;
  opponent?: string;
  opponent_attack?: number;
  opponent_defense?: number;
  opponent_hp?: number;
  scene_name?: string;
  scene_type?: string;
  scene_region?: string;
  scene_description?: string;
  scene_connected?: string[];
  scene_resources?: string[];
  scene_dangerous?: boolean;
  npc_id?: string;
  npc_name?: string;
  npc_role?: string;
  npc_realm?: string;
  npc_sect?: string;
  npc_description?: string;
  npc_attackable?: boolean;
  npc_attack?: number;
  npc_defense?: number;
  npc_maxhp?: number;
  npc_location?: string;
  target_npc?: string;
  favor_change?: number;
}

export interface AppliedEvent {
  id: string;
  runId: string;
  type: ResourceChange['type'] | 'rejected_change';
  summary: string;
  payload: ResourceChange;
  accepted: boolean;
  reason?: string;
  createdAt: string;
}

export interface ApplyResourceResult {
  nextState: GameState;
  summary: string;
  events: AppliedEvent[];
  breakthroughRealm?: string;
}
