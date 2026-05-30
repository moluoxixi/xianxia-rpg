import type {
  GameHostClient,
  HostInventoryPinsLoadPayload,
  HostInventoryPinsPayload,
  HostLoadGameByRunIdPayload,
  HostMessagePayload,
  HostRequestMethod,
  HostRequestPath,
  HostSettingsPayload,
} from '@xianxia-rpg/shared';

interface HostRequestOptions<TBody> {
  method: HostRequestMethod;
  body?: TBody;
}

/**
 * 前端统一请求入口：业务层只关心同一组路径，Electron 环境映射到 IPC，
 * 普通 Web 环境则请求同名 HTTP API，便于桌面端和网页端共享一套前端代码。
 */
export function requestHost<TResult, TBody = unknown>(
  path: HostRequestPath,
  options: HostRequestOptions<TBody>,
): Promise<TResult> {
  const ipcClient = window.gameAPI;
  return ipcClient
    ? requestElectronHost<TResult, TBody>(ipcClient, path, options)
    : requestHttpHost<TResult, TBody>(path, options);
}

function requestElectronHost<TResult, TBody>(
  client: GameHostClient,
  path: HostRequestPath,
  options: HostRequestOptions<TBody>,
): Promise<TResult> {
  switch (`${options.method} ${path}`) {
    case 'POST /ai/message':
      return client.sendMessage(options.body as HostMessagePayload) as Promise<TResult>;
    case 'POST /ai/config/runtime':
      return client.updateAIConfig(options.body as HostSettingsPayload) as Promise<TResult>;
    case 'POST /ai/config':
      return client.saveAIConfig(options.body as HostSettingsPayload) as Promise<TResult>;
    case 'GET /ai/config':
      return client.loadAIConfig() as Promise<TResult>;
    case 'POST /ai/config/test':
      return client.testAIConnection(options.body as HostSettingsPayload) as Promise<TResult>;
    case 'POST /game/save':
      return client.saveGame(options.body) as Promise<TResult>;
    case 'GET /game/latest':
      return client.loadGame() as Promise<TResult>;
    case 'POST /game/load':
      return client.loadGameByRunId((options.body as HostLoadGameByRunIdPayload).runId) as Promise<TResult>;
    case 'GET /game/saves':
      return client.listGameSaves() as Promise<TResult>;
    case 'POST /game/death-archives':
      return client.saveDeathArchive(options.body) as Promise<TResult>;
    case 'POST /game/inventory-pins':
      return client.saveInventoryPins(options.body as HostInventoryPinsPayload) as Promise<TResult>;
    case 'POST /game/inventory-pins/load':
      return client.loadInventoryPins((options.body as HostInventoryPinsLoadPayload).runId) as Promise<TResult>;
    default:
      throw new Error(`未注册的 Electron host 路由: ${options.method} ${path}`);
  }
}

async function requestHttpHost<TResult, TBody>(
  path: HostRequestPath,
  options: HostRequestOptions<TBody>,
): Promise<TResult> {
  const init: RequestInit = { method: options.method };

  if (options.method === 'POST') {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(resolveHostUrl(path), init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`${path} 未返回 JSON，请确认 Web 后端 API 已接入`);
  }

  return await response.json() as TResult;
}

function resolveHostUrl(path: HostRequestPath): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return apiBaseUrl ? `${normalizeBaseUrl(apiBaseUrl)}${path}` : path;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}
