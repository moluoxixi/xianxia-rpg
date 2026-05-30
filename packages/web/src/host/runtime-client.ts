import type { GameHostClient } from '@xianxia-rpg/core';
import { createRequestGameHostClient } from './request-client';

let cachedClient: GameHostClient | null = null;

export function getGameHostClient(): GameHostClient {
  cachedClient ??= createRequestGameHostClient();
  return cachedClient;
}
