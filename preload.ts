import { contextBridge, ipcRenderer } from 'electron';

/** 渲染进程可用的游戏 API */
export interface GameAPI {
  /** 发送消息给 AI */
  sendMessage: (payload: { message: string; history: Array<{ role: string; content: string }> }) => Promise<{
    success: boolean;
    reply: string;
    error?: string;
  }>;
  /** 保存游戏数据 */
  saveGame: (data: unknown) => Promise<{ success: boolean; message: string }>;
  /** 读取游戏数据 */
  loadGame: () => Promise<{ success: boolean; data: unknown }>;
  /** 更新 AI 配置（运行时） */
  updateAIConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  /** 保存 AI 配置到文件 */
  saveAIConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  /** 从文件加载 AI 配置 */
  loadAIConfig: () => Promise<{ success: boolean; data: unknown }>;
  /** 测试 AI 连接 */
  testAIConnection: (config: Record<string, unknown>) => Promise<{ success: boolean; reply?: string; error?: string }>;
  /** 保存死亡存档（仅简单模式） */
  saveDeathArchive: (data: unknown) => Promise<{ success: boolean; message: string }>;
}

contextBridge.exposeInMainWorld('gameAPI', {
  sendMessage: (payload: { message: string; history: Array<{ role: string; content: string }> }) =>
    ipcRenderer.invoke('send-to-ai', payload),

  saveGame: (data: unknown) =>
    ipcRenderer.invoke('save-game-data', data),

  loadGame: () =>
    ipcRenderer.invoke('load-game-data'),

  updateAIConfig: (config: Record<string, unknown>) =>
    ipcRenderer.invoke('update-ai-config', config),

  saveAIConfig: (config: Record<string, unknown>) =>
    ipcRenderer.invoke('save-ai-config', config),

  loadAIConfig: () =>
    ipcRenderer.invoke('load-ai-config'),

  testAIConnection: (config: Record<string, unknown>) =>
    ipcRenderer.invoke('test-ai-connection', config),

  saveDeathArchive: (data: unknown) =>
    ipcRenderer.invoke('save-death-archive', data),
});
