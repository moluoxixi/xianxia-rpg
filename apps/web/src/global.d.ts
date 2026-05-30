import type { GameHostClient } from '@xianxia-rpg/shared';

export {};

declare global {
  interface Window {
    gameAPI?: GameHostClient;
  }
}
