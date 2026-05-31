import type { AIProviderType } from '@xianxia-rpg/core';
import fs from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';

let runtimeEnvLoaded = false;

/**
 * Load local environment files on the server side only.
 * This keeps API keys out of the web bundle while still letting settings read defaults from `/ai/config`.
 */
export function loadRuntimeEnv(): void {
  if (runtimeEnvLoaded)
    return;

  for (const envPath of createRuntimeEnvPaths()) {
    if (fs.existsSync(envPath)) {
      const result = loadDotenv({ path: envPath, override: false, quiet: true });
      if (result.error)
        throw result.error;
    }
  }

  runtimeEnvLoaded = true;
}

export function createDefaultProviderApiKeys(): Record<AIProviderType, string> {
  return {
    openai: process.env.XIANXIA_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
    anthropic: process.env.XIANXIA_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '',
  };
}

function createRuntimeEnvPaths(): string[] {
  const candidateRoots = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../../..'),
  ];
  const envFiles = ['.env.local', '.env'];

  return [...new Set(candidateRoots.flatMap(root => envFiles.map(file => path.join(root, file))))];
}
