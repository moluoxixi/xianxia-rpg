import type { GameSaveSummary, NPC } from '@xianxia-rpg/shared';
import type { ReactNode, RefObject } from 'react';
import type { AIConfigForm, ChatMessage, Choice, Difficulty, GameState, InventoryItem } from '@/domain';

export interface AppHeaderProps {
  difficulty: Difficulty;
  onOpenMenu: () => void;
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
  selectedInventoryKey: string | null;
  pinnedInventoryKeys: string[];
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: InventoryItem) => void;
  onUseItem: (item: InventoryItem) => void;
  onDropItem: (index: number) => void;
  onTogglePin: (item: InventoryItem) => void;
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
  selectedInventoryKey: string | null;
  pinnedInventoryKeys: string[];
  onOpenInventory: (item?: InventoryItem) => void;
  onSelectInventoryItem: (item: InventoryItem) => void;
  onUseInventoryItem: (item: InventoryItem) => void;
  onDropInventoryItem: (index: number) => void;
  onToggleInventoryPin: (item: InventoryItem) => void;
}

export interface HeaderButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export interface InventoryItemEntryProps {
  item: InventoryItem;
  index: number;
  pinned: boolean;
  selected?: boolean;
  compact?: boolean;
  onViewDetails: (item: InventoryItem) => void;
  onUseItem: (item: InventoryItem) => void;
  onDropItem: (index: number) => void;
  onTogglePin: (item: InventoryItem) => void;
}

export interface MainMenuProps {
  saves: GameSaveSummary[];
  loading: boolean;
  message: string;
  onContinue: () => void;
  onNewGame: () => void;
  onLoadSave: (runId: string) => void;
  onOpenSettings: () => void;
  onRefreshSaves: () => void;
}
