export { parseChoices, parseQuickActions, parseResourceChanges, stripChoices } from './ai-protocol';
export {
  cloneInitialState,
  cloneScenarioInitialState,
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
export { defaultNovelApiBuildRequestCode, defaultNovelApiMapResponseCode, normalizeNovelApiProvider } from './novel-api-config';
export type { LocalActionResolution } from './game-engine';
export { availableNovelScenarios, createDefaultScenarioPack, createScenarioFromNovelTitle, normalizeScenarioPack } from './scenario';
export type { NovelScenarioOption, ScenarioPack } from './scenario';
export type { AIConfigForm, CharacterInfo, CharacterStats, ChatMessage, Choice, Difficulty, InventoryItem, InventoryViewItem, NovelApiProvider, Role, Skill } from './types';
