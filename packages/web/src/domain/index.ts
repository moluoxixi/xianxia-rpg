export { parseChoices, parseQuickActions, parseResourceChanges, stripChoices } from './ai-protocol';
export {
  cloneInitialState,
  createInitialGameState,
  createInventoryViewItems,
  createMessage,
  getDefaultQuickActions,
  getInventoryItemKey,
  getItemIcon,
  getTimeStr,
  itemDescriptions,
  mergeQuickActions,
  normalizeLoadedGameState,
  pinnedItems,
  statPercent,
} from './game-data';
export { applyResourceChanges, buildPlayerStatus, createLocalActionChanges, removeRemoteChangesCoveredByLocal } from './game-engine';
export type { AppliedEvent, ApplyResourceResult, GameState, ResourceChange } from './game-state';
export type { AIConfigForm, CharacterInfo, CharacterStats, ChatMessage, Choice, Difficulty, InventoryItem, InventoryViewItem, Role, Skill } from './types';
