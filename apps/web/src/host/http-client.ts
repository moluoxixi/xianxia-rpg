import type {
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
} from '@xianxia-rpg/shared';

export function createHttpGameHostClient(baseUrl: string): GameHostClient {
  const apiBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    sendMessage: async payload =>
      postJson<HostMessagePayload, HostMessageResult>(apiBaseUrl, '/ai/message', payload)
        .catch(error => ({ success: false, reply: '', error: getErrorMessage(error) })),
    saveGame: async data =>
      postJson<unknown, HostSaveGameResult>(apiBaseUrl, '/game/save', data)
        .catch(error => ({ success: false, message: getErrorMessage(error) })),
    loadGame: async () =>
      getJson<HostLoadGameResult>(apiBaseUrl, '/game/latest')
        .catch(error => ({ success: false, data: null, message: getErrorMessage(error) })),
    updateAIConfig: async config =>
      postJson<HostSettingsPayload, HostSettingsResult>(apiBaseUrl, '/ai/config/runtime', config)
        .catch(error => ({ success: false, message: getErrorMessage(error) })),
    saveAIConfig: async config =>
      postJson<HostSettingsPayload, HostSettingsResult>(apiBaseUrl, '/ai/config', config)
        .catch(error => ({ success: false, message: getErrorMessage(error) })),
    loadAIConfig: async () =>
      getJson<HostAIConfigResult>(apiBaseUrl, '/ai/config')
        .catch(error => ({ success: false, data: null, message: getErrorMessage(error) })),
    testAIConnection: async config =>
      postJson<HostSettingsPayload, HostConnectionResult>(apiBaseUrl, '/ai/config/test', config)
        .catch(error => ({ success: false, error: getErrorMessage(error) })),
    saveDeathArchive: async data =>
      postJson<unknown, HostDeathArchiveResult>(apiBaseUrl, '/game/death-archives', data)
        .catch(error => ({ success: false, message: getErrorMessage(error) })),
  };
}

async function getJson<TResult>(baseUrl: string, path: string): Promise<TResult> {
  return requestJson<TResult>(baseUrl, path, { method: 'GET' });
}

async function postJson<TBody, TResult>(baseUrl: string, path: string, body: TBody): Promise<TResult> {
  return requestJson<TResult>(baseUrl, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function requestJson<TResult>(baseUrl: string, path: string, init: RequestInit): Promise<TResult> {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  return await response.json() as TResult;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
