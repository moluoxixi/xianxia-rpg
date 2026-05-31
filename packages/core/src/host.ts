import type { HostNovelSearchResult } from './novel';

export interface HostMessagePayload {
  message: string;
  history: Array<{ role: string; content: string }>;
}

export interface HostMessageResult {
  success: boolean;
  reply: string;
  error?: string;
}

export interface HostSaveGameResult {
  success: boolean;
  message: string;
  data?: unknown;
  runId?: string;
}

export interface HostLoadGameResult {
  success: boolean;
  data: unknown;
  message?: string;
}

export interface GameSaveSummary {
  runId: string;
  playerName: string;
  realm: string;
  currentScene: string;
  updatedAt: string;
  themeId?: string;
  referenceNovel?: string;
}

export interface HostLoadGameByRunIdPayload {
  runId: string;
}

export interface HostGameSavesResult {
  success: boolean;
  data: GameSaveSummary[];
  message?: string;
}

export type HostSettingsPayload = Record<string, unknown>;

export interface HostSettingsResult {
  success: boolean;
  message: string;
}

export interface HostAIConfigResult {
  success: boolean;
  data: unknown;
  message?: string;
}

export interface HostConnectionResult {
  success: boolean;
  reply?: string;
  error?: string;
}

export interface HostDeathArchiveResult {
  success: boolean;
  message: string;
  data?: unknown;
  runId?: string;
}

export interface HostInventoryPinsLoadPayload {
  runId: string;
}

export interface HostInventoryPinsPayload {
  runId: string;
  pinnedKeys: string[];
}

export interface HostInventoryPinsResult {
  success: boolean;
  data: string[];
  message?: string;
}

export interface HostInventoryPinsSaveResult {
  success: boolean;
  message: string;
  data?: string[];
  runId?: string;
}

export type HostRequestMethod = 'GET' | 'POST';

export type HostRequestPath
  = | '/ai/message'
    | '/ai/config/runtime'
    | '/ai/config'
    | '/ai/config/test'
    | '/game/save'
    | '/game/load'
    | '/game/latest'
    | '/game/saves'
    | '/game/death-archives'
    | '/game/inventory-pins'
    | '/game/inventory-pins/load'
    | '/novels/search';

export interface GameHostClient {
  /** AI 对话入口；网页端和 Electron 桌面壳都通过同名 HTTP API 实现。 */
  sendMessage: (payload: HostMessagePayload) => Promise<HostMessageResult>;
  /** 保存当前游戏快照。 */
  saveGame: (data: unknown) => Promise<HostSaveGameResult>;
  /** 读取最近一次游戏快照。 */
  loadGame: () => Promise<HostLoadGameResult>;
  /** 按存档 ID 读取游戏快照。 */
  loadGameByRunId: (runId: string) => Promise<HostLoadGameResult>;
  /** 列出可读取的游戏存档。 */
  listGameSaves: () => Promise<HostGameSavesResult>;
  /** 按当前存档读取背包置顶项。 */
  loadInventoryPins: (runId: string) => Promise<HostInventoryPinsResult>;
  /** 按当前存档保存背包置顶项。 */
  saveInventoryPins: (payload: HostInventoryPinsPayload) => Promise<HostInventoryPinsSaveResult>;
  /** 更新当前运行时 AI 配置。 */
  updateAIConfig: (config: HostSettingsPayload) => Promise<HostSettingsResult>;
  /** 持久化 AI 配置。 */
  saveAIConfig: (config: HostSettingsPayload) => Promise<HostSettingsResult>;
  /** 读取持久化 AI 配置。 */
  loadAIConfig: () => Promise<HostAIConfigResult>;
  /** 验证 AI 连接。 */
  testAIConnection: (config: HostSettingsPayload) => Promise<HostConnectionResult>;
  /** 保存死亡归档。 */
  saveDeathArchive: (data: unknown) => Promise<HostDeathArchiveResult>;
  /** 搜索可用于生成剧本的参考小说。 */
  searchNovels: (keyword: string) => Promise<HostNovelSearchResult>;
}
