import type { GameHostClient } from '@xianxia-rpg/shared';
import { createHttpGameHostClient } from './http-client';
import { createLocalGameHostClient } from './local-client';

let cachedClient: GameHostClient | null = null;

export function getGameHostClient(): GameHostClient {
  cachedClient ??= window.gameAPI ?? createBrowserGameHostClient();
  return cachedClient;
}

function createBrowserGameHostClient(): GameHostClient {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return apiBaseUrl ? createHttpGameHostClient(apiBaseUrl) : createLocalGameHostClient();
}
