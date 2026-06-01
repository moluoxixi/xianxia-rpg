export type {
  AIAdapter,
  AIChatRequest,
  AIChatResponse,
  AIProviderConfig,
  AIProviderType,
  ChatMessage,
  MessageRole,
} from './src/ai';
export {
  resolveCombat,
} from './src/combat';
export type {
  CombatLog,
  CombatResult,
  CombatRound,
} from './src/combat';
export type {
  DifficultyConfig,
  GameDifficulty,
  GameStatus,
} from './src/game';
export {
  DIFFICULTY_PRESETS,
} from './src/game';
export type {
  GameSaveSummary,
  GameHostClient,
  HostDeleteGamePayload,
  HostDeleteGameResult,
  HostGameSavesResult,
  HostAIConfigResult,
  HostConnectionResult,
  HostDeathArchiveResult,
  HostLoadGameByRunIdPayload,
  HostInventoryPinsLoadPayload,
  HostInventoryPinsPayload,
  HostInventoryPinsResult,
  HostInventoryPinsSaveResult,
  HostLoadGameResult,
  HostMessagePayload,
  HostMessageResult,
  HostRequestMethod,
  HostRequestPath,
  HostSaveGameResult,
  HostScenarioGeneratePayload,
  HostScenarioGenerateResult,
  HostSettingsPayload,
  HostSettingsResult,
} from './src/host';
export type {
  HostNovelSearchResult,
  NovelSearchPayload,
  NovelSummary,
} from './src/novel';
export {
  createDefaultNovelApiSettings,
  defaultNovelApiBaseURL,
  defaultNovelApiBuildRequestCode,
  defaultNovelApiKey,
  defaultNovelApiMapResponseCode,
  defaultNovelApiProvider,
  normalizeNovelApiProvider,
} from './src/novel-api-config';
export type {
  NovelApiProvider,
  NovelApiSettingsPreset,
} from './src/novel-api-config';
export type {
  NPC,
  NPCRole,
  Resource,
  ResourceType,
  Scene,
  SceneType,
} from './src/scene';
