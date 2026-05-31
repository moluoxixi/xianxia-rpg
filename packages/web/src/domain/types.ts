import type { AIProviderType } from '@xianxia-rpg/core';
import type { AIModelCatalog } from '@xianxia-rpg/model';

export type Role = 'user' | 'assistant' | 'system';
export type Difficulty = 'normal' | 'hard';
export type NovelApiProvider = 'disabled' | 'compatible' | 'custom-functions';

export interface CharacterInfo {
  name: string;
  realm: string;
  sect: string;
  location: string;
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
}

export interface InventoryItem {
  id?: string;
  name: string;
  count: number;
  type?: 'pill' | 'spirit_stone' | 'weapon' | 'material' | 'talisman' | 'manual' | 'quest' | 'misc';
  rarity?: 'common' | 'low' | 'middle' | 'high' | 'top' | 'rare';
  description?: string;
  usable?: boolean;
  sourceScene?: string;
  discoveredAt?: string;
}

export interface InventoryViewItem {
  key: string;
  item: InventoryItem;
  index: number;
  pinned: boolean;
}

export interface Skill {
  id?: string;
  name: string;
  level: string;
  type?: 'main' | 'combat' | 'movement' | 'alchemy' | 'crafting' | 'spiritual_sense' | 'support';
  proficiency?: number;
  source?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  time: string;
}

export interface Choice {
  index: number;
  text: string;
}

export interface AIConfigForm {
  type: AIProviderType;
  baseURL: string;
  apiKey: string;
  model: string;
  modelCatalog: AIModelCatalog;
  maxTokens: string;
  temperature: string;
  systemPrompt: string;
  novelApiProvider: NovelApiProvider;
  novelApiBaseURL: string;
  novelApiKey: string;
  novelApiBuildRequestCode: string;
  novelApiMapResponseCode: string;
}
