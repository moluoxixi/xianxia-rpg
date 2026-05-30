import type { GameHostClient, HostInventoryPinsPayload } from './packages/shared/index';
import { contextBridge, ipcRenderer } from 'electron';

const gameAPI: GameHostClient = {
  sendMessage: (payload: { message: string; history: Array<{ role: string; content: string }> }) =>
    ipcRenderer.invoke('send-to-ai', payload),

  saveGame: (data: unknown) =>
    ipcRenderer.invoke('save-game-data', data),

  loadGame: () =>
    ipcRenderer.invoke('load-game-data'),

  loadGameByRunId: (runId: string) =>
    ipcRenderer.invoke('load-game-data-by-run-id', runId),

  listGameSaves: () =>
    ipcRenderer.invoke('list-game-saves'),

  loadInventoryPins: (runId: string) =>
    ipcRenderer.invoke('load-inventory-pins', runId),

  saveInventoryPins: (payload: HostInventoryPinsPayload) =>
    ipcRenderer.invoke('save-inventory-pins', payload),

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
};

contextBridge.exposeInMainWorld('gameAPI', gameAPI);
