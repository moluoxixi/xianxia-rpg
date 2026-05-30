import type { NPC } from '@xianxia-rpg/shared';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { AIConfigForm, ChatMessage, Choice, Difficulty, GameState } from '@/domain';

export interface GameSessionController {
  gameState: GameState;
  messages: ChatMessage[];
  input: string;
  quickActions: string[];
  choices: Choice[];
  isSending: boolean;
  settingsOpen: boolean;
  inventoryOpen: boolean;
  breakthroughRealm: string;
  config: AIConfigForm;
  viewportRef: RefObject<HTMLDivElement | null>;
  sceneNpcs: NPC[];
  hasReviveStone: boolean;
  setInput: Dispatch<SetStateAction<string>>;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
  setInventoryOpen: Dispatch<SetStateAction<boolean>>;
  setConfig: Dispatch<SetStateAction<AIConfigForm>>;
  sendAction: (action?: string) => Promise<void>;
  openSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  resetGame: () => void;
  revivePlayer: () => void;
  dropItem: (index: number) => void;
  changeDifficulty: (difficulty: Difficulty) => void;
}
