export { parseChoices, parseQuickActions, parseResourceChanges, stripChoices } from './ai-protocol';
export {
  cloneInitialState,
  createInitialGameState,
  createInventoryViewItems,
  createMessage,
  cultivationRealms,
  getDefaultQuickActions,
  getInventoryItemKey,
  getItemIcon,
  getNextRealm,
  getRealmLevel,
  getRealmMaxExp,
  getTimeStr,
  itemDescriptions,
  mergeQuickActions,
  normalizeLoadedGameState,
  pinnedItems,
  realmAliases,
  realmLevels,
  resolveRealmName,
  statPercent,
} from './game-data';
export { applyResourceChanges, buildPlayerStatus, createLocalActionChanges, removeRemoteChangesCoveredByLocal, resolveLocalAction } from './game-engine';
export type { AppliedEvent, ApplyResourceResult, GameState, ResourceChange } from './game-state';
export type { LocalActionResolution } from './game-engine';
export type { AIConfigForm, CharacterInfo, CharacterStats, ChatMessage, Choice, Difficulty, InventoryItem, InventoryViewItem, Role, Skill } from './types';
