import type { GameHostClient, HostSettingsPayload } from '@xianxia-rpg/shared';

const SAVE_KEY = 'xianxia-rpg:web-save';
const CONFIG_KEY = 'xianxia-rpg:web-ai-config';
const DEATH_ARCHIVE_KEY = 'xianxia-rpg:web-death-archive';

export function createLocalGameHostClient(): GameHostClient {
  return {
    async sendMessage(payload) {
      return {
        success: true,
        reply: `网页模式未连接 AI 服务，已收到你的行动：“${payload.message}”。\n\n[快捷指令]{"actions":["观察四周","修炼功法","整理背包","前往练功房"]}`,
      };
    },

    async saveGame(data) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return { success: true, message: '网页存档已保存', data };
    },

    async loadGame() {
      const result = readStorageJson(SAVE_KEY);
      return result.success ? { success: true, data: result.data } : { success: false, data: null, message: result.message };
    },

    async updateAIConfig(config) {
      persistConfig(config);
      return { success: true, message: '网页运行时配置已更新' };
    },

    async saveAIConfig(config) {
      persistConfig(config);
      return { success: true, message: '网页 AI 配置已保存' };
    },

    async loadAIConfig() {
      const result = readStorageJson(CONFIG_KEY);
      return result.success ? { success: true, data: result.data } : { success: false, data: null, message: result.message };
    },

    async testAIConnection() {
      return { success: false, error: '网页模式未配置 AI 服务连接。' };
    },

    async saveDeathArchive(data) {
      localStorage.setItem(DEATH_ARCHIVE_KEY, JSON.stringify(data));
      return { success: true, message: '网页死亡归档已保存', data };
    },
  };
}

function persistConfig(config: HostSettingsPayload): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function readStorageJson(key: string): { success: true; data: unknown } | { success: false; message: string } {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return { success: true, data: null };
  }

  try {
    return { success: true, data: JSON.parse(raw) };
  }
  catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}
