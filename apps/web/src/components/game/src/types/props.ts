import type { NPC } from '@xianxia-rpg/shared';
import type { ReactNode, RefObject } from 'react';
import type { AIConfigForm, ChatMessage, Choice, Difficulty, GameState, InventoryItem } from '@/domain';

export interface AppHeaderProps {
  difficulty: Difficulty;
  onOpenSettings: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export interface BreakthroughOverlayProps {
  realm: string;
}

export interface ChatPanelProps {
  messages: ChatMessage[];
  viewportRef: RefObject<HTMLDivElement | null>;
  characterName: string;
  choices: Choice[];
  quickActions: string[];
  input: string;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onSend: (action?: string) => void;
}

export interface DeathOverlayProps {
  hard: boolean;
  canRevive: boolean;
  onRevive: () => void;
  onRestart: () => void;
}

export interface InventoryDialogProps {
  open: boolean;
  items: InventoryItem[];
  onOpenChange: (open: boolean) => void;
  onUseItem: (name: string) => void;
  onDropItem: (index: number) => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  characterName: string;
}

export interface SettingsDialogProps {
  open: boolean;
  config: AIConfigForm;
  difficulty: Difficulty;
  onOpenChange: (open: boolean) => void;
  onConfigChange: (config: AIConfigForm) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onSave: () => void;
}

export interface StatusSidebarProps {
  gameState: GameState;
  sceneNpcs: NPC[];
  onOpenInventory: () => void;
}

export interface HeaderButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}
