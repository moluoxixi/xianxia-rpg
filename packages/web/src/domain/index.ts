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
export { createDefaultNovelApiSettings, defaultNovelApiBaseURL, defaultNovelApiBuildRequestCode, defaultNovelApiKey, defaultNovelApiMapResponseCode, defaultNovelApiProvider, normalizeNovelApiProvider } from './novel-api-config';
export type { NovelApiProvider } from './novel-api-config';
export type { LocalActionResolution } from './game-engine';
export { availableNovelScenarios, createDefaultScenarioPack, createRecommendedNovelSummaries, createScenarioFromNovelTitle, mergeNovelSummaries, normalizeScenarioPack } from './scenario';
export type { NovelScenarioOption, ScenarioPack } from './scenario';
export { DEFAULT_THEME_ID, gameThemePresets, getGameThemePreset, inferThemeIdFromNovel, inferThemeIdFromSave, normalizeThemeId, normalizeThemeSource, themeIds } from './theme';
export type { GameThemeId, GameThemePreset, GameThemeSource, ThemeSaveSummary } from './theme';
export type { AIConfigForm, CharacterInfo, CharacterStats, ChatMessage, Choice, Difficulty, InventoryItem, InventoryViewItem, Role, Skill } from './types';
