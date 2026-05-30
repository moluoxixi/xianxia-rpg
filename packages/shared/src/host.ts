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

export interface GameHostClient {
  /** AI 对话入口；Electron 通过 IPC 实现，网页构建可替换为 HTTP 或本地 fallback。 */
  sendMessage: (payload: HostMessagePayload) => Promise<HostMessageResult>;
  /** 保存当前游戏快照。 */
  saveGame: (data: unknown) => Promise<HostSaveGameResult>;
  /** 读取最近一次游戏快照。 */
  loadGame: () => Promise<HostLoadGameResult>;
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
}
