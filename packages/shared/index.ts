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
  GameHostClient,
  HostAIConfigResult,
  HostConnectionResult,
  HostDeathArchiveResult,
  HostLoadGameResult,
  HostMessagePayload,
  HostMessageResult,
  HostSaveGameResult,
  HostSettingsPayload,
  HostSettingsResult,
} from './src/host';
export {
  INITIAL_SCENE,
} from './src/scene';
export type {
  NPC,
  NPCRole,
  Resource,
  ResourceType,
  Scene,
  SceneType,
} from './src/scene';
