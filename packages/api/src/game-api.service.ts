import type { HostInventoryPinsPayload, HostMessagePayload, HostNovelSearchResult, HostScenarioGeneratePayload, HostScenarioGenerateResult, HostSettingsPayload, NovelSearchPayload } from '@xianxia-rpg/core';
import type { OnModuleInit } from '@nestjs/common';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { createDefaultNovelApiSettings, normalizeNovelApiProvider } from '@xianxia-rpg/core';
import { getAIProviderPreset } from '@xianxia-rpg/model';
import type { AIChatRequest, AIProviderConfig } from './ai';
import { chatWithAI } from './ai';
import { createDefaultAIConfig } from './default-ai-config';
import type { RuntimeAIConfig } from './default-ai-config';
import { GameDatabase } from './infrastructure/database';
import { searchNovelsWithAI } from './ai-novel-search';
import { searchRemoteNovels } from './novel-search';
import type { NovelApiSettings } from './novel-search';
import { generateScenarioWithAI } from './scenario-generation';

@Injectable()
export class GameApiService implements OnModuleInit {
  private readonly database = new GameDatabase(path.join(getDataDir(), 'game-runs.sqlite'));

  private readonly aiConfig: RuntimeAIConfig = createDefaultAIConfig();

  async onModuleInit(): Promise<void> {
    await this.database.init();
    const storedConfig = this.database.loadAIConfig();
    if (storedConfig) {
      Object.assign(this.aiConfig, normalizeRuntimeAIConfig(this.aiConfig, storedConfig));
    }
  }

  async saveGame(data: Record<string, unknown>): Promise<{ success: boolean; message: string; data: unknown; runId: string }> {
    await this.database.init();
    const record = this.database.saveGame(data);
    return { success: true, message: '存档成功', data: record.snapshot, runId: record.runId };
  }

  async loadLatestGame(): Promise<{ success: boolean; data: unknown }> {
    await this.database.init();
    const record = this.database.loadLatestGame();
    return { success: true, data: record?.snapshot ?? null };
  }

  async loadGameByRunId(runId: string): Promise<{ success: boolean; data: unknown }> {
    await this.database.init();
    const record = this.database.loadGameByRunId(runId);
    return { success: true, data: record?.snapshot ?? null };
  }

  async listGameSaves(): Promise<{ success: boolean; data: ReturnType<GameDatabase['listGameSaves']> }> {
    await this.database.init();
    return { success: true, data: this.database.listGameSaves() };
  }

  async deleteGame(runId: string): Promise<{ success: boolean; message: string; runId?: string }> {
    await this.database.init();
    const deleted = this.database.deleteGame(runId);
    if (!deleted)
      return { success: false, message: '存档不存在或已删除' };
    return { success: true, message: '存档已删除', runId };
  }

  async saveDeathArchive(data: Record<string, unknown>): Promise<{ success: boolean; message: string; data: unknown; runId: string }> {
    await this.database.init();
    const record = this.database.saveDeathArchive(data);
    return { success: true, message: '死亡存档已保存', data: record.snapshot, runId: record.runId };
  }

  async saveInventoryPins(payload: HostInventoryPinsPayload): Promise<{ success: boolean; message: string; data: string[]; runId: string }> {
    await this.database.init();
    const record = this.database.saveInventoryPins(payload);
    return { success: true, message: '背包置顶已保存', data: record.pinnedKeys, runId: record.runId };
  }

  async loadInventoryPins(runId: string): Promise<{ success: boolean; data: string[] }> {
    await this.database.init();
    return { success: true, data: this.database.loadInventoryPins(runId) };
  }

  async searchNovels(payload: NovelSearchPayload): Promise<HostNovelSearchResult> {
    await this.database.init();
    const storedConfig = this.database.loadAIConfig();
    const novelApiSettings = createRuntimeNovelApiSettings(storedConfig);
    const provider = normalizeNovelApiProvider(novelApiSettings.novelApiProvider);
    if (provider === 'ai')
      return searchNovelsWithAI(this.aiConfig, payload.keyword);
    if (provider === 'compatible' || provider === 'custom-functions')
      return searchRemoteNovels({ ...novelApiSettings, novelApiProvider: provider } as NovelApiSettings, payload.keyword);

    return { success: false, data: [], message: '小说 API 未启用，请先在设置中配置小说来源。' };
  }

  async generateScenario(payload: HostScenarioGeneratePayload): Promise<HostScenarioGenerateResult> {
    return generateScenarioWithAI(this.aiConfig, payload);
  }

  async sendMessage(payload: HostMessagePayload): Promise<{ success: boolean; reply: string; error?: string }> {
    if (!this.aiConfig.apiKey || this.aiConfig.apiKey === 'YOUR_API_KEY') {
      return {
        success: true,
        reply: `[AI回复占位] 你说了："${payload.message}"\n\n（AI接口尚未配置 API Key，请在设置中配置后保存）`,
      };
    }

    const request: AIChatRequest = {
      messages: payload.history.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
      userMessage: payload.message,
    };
    const result = await chatWithAI(this.aiConfig, request);
    return result.success ? { success: true, reply: result.reply } : { success: false, reply: '', error: result.error ?? '未知错误' };
  }

  async updateAIConfig(config: HostSettingsPayload): Promise<{ success: boolean; message: string }> {
    Object.assign(this.aiConfig, normalizeRuntimeAIConfig(this.aiConfig, config));
    return { success: true, message: `AI 配置已更新: ${this.aiConfig.type} / ${this.aiConfig.model}` };
  }

  async saveAIConfig(config: HostSettingsPayload): Promise<{ success: boolean; message: string }> {
    await this.database.init();
    const normalizedConfig = normalizeRuntimeAIConfig(this.aiConfig, config);
    this.database.saveAIConfig({ ...normalizedConfig });
    Object.assign(this.aiConfig, normalizedConfig);
    return { success: true, message: 'AI 配置已保存' };
  }

  async loadAIConfig(): Promise<{ success: boolean; data: RuntimeAIConfig }> {
    await this.database.init();
    const storedConfig = this.database.loadAIConfig();
    const runtimeConfig = storedConfig ? normalizeRuntimeAIConfig(this.aiConfig, storedConfig) : this.aiConfig;
    return { success: true, data: { ...runtimeConfig, ...createRuntimeNovelApiSettings(storedConfig) } };
  }

  async testAIConnection(testConfig: Record<string, unknown>): Promise<{ success: boolean; reply?: string; error?: string }> {
    const config: AIProviderConfig = {
      type: (testConfig.type as AIProviderConfig['type']) ?? 'openai',
      baseURL: (testConfig.baseURL as string) ?? '',
      apiKey: (testConfig.apiKey as string) ?? '',
      model: (testConfig.model as string) ?? '',
      maxTokens: 64,
      temperature: 0,
      systemPrompt: '测试连接，请回复"连接成功"四个字。',
    };
    const result = await chatWithAI(config, { messages: [], userMessage: '测试' });
    return result.success ? { success: true, reply: result.reply } : { success: false, error: result.error ?? '连接失败' };
  }
}

function getDataDir(): string {
  return process.env.XIANXIA_DATA_DIR ?? path.join(process.cwd(), 'data');
}

function normalizeRuntimeAIConfig(baseConfig: RuntimeAIConfig, patch: HostSettingsPayload): RuntimeAIConfig {
  const type = (patch.type ?? baseConfig.type) as RuntimeAIConfig['type'];
  const patchProviderBaseURLs = patch.providerBaseURLs as Partial<RuntimeAIConfig['providerBaseURLs']> | undefined;
  const providerApiKeys = {
    ...baseConfig.providerApiKeys,
    ...(patch.providerApiKeys as Partial<RuntimeAIConfig['providerApiKeys']> | undefined),
  };
  const providerBaseURLs = {
    ...baseConfig.providerBaseURLs,
    ...patchProviderBaseURLs,
  };
  const providers: RuntimeAIConfig['type'][] = ['openai', 'anthropic'];
  for (const provider of providers) {
    providerApiKeys[provider] = providerApiKeys[provider] || baseConfig.providerApiKeys[provider];
    providerBaseURLs[provider] = normalizeProviderBaseURL(provider, providerBaseURLs[provider], baseConfig.providerBaseURLs[provider], Boolean(patchProviderBaseURLs));
  }

  const apiKey = String(patch.apiKey || providerApiKeys[type] || baseConfig.apiKey);
  const patchBaseURL = String(patch.baseURL ?? '');
  const baseURL = patchBaseURL && (patchProviderBaseURLs || !isPresetBaseURL(type, patchBaseURL)) ? patchBaseURL : String(providerBaseURLs[type] || baseConfig.baseURL);
  providerApiKeys[type] = apiKey;
  providerBaseURLs[type] = baseURL;

  return {
    ...baseConfig,
    ...patch,
    type,
    baseURL,
    apiKey,
    providerApiKeys,
    providerBaseURLs,
  } as RuntimeAIConfig;
}

function createRuntimeNovelApiSettings(storedConfig: HostSettingsPayload | null): ReturnType<typeof createDefaultNovelApiSettings> {
  const defaults = createDefaultNovelApiSettings();
  const settings = { ...defaults, ...storedConfig };
  const isLegacyOpenLibraryDefault = settings.novelApiProvider === 'custom-functions'
    && settings.novelApiBaseURL === defaults.novelApiBaseURL
    && String(settings.novelApiBuildRequestCode ?? '').includes('character.charCodeAt');

  return {
    novelApiProvider: isLegacyOpenLibraryDefault ? 'ai' : normalizeNovelApiProvider(settings.novelApiProvider),
    novelApiBaseURL: String(settings.novelApiBaseURL ?? defaults.novelApiBaseURL),
    novelApiKey: String(settings.novelApiKey ?? defaults.novelApiKey),
    novelApiBuildRequestCode: String(settings.novelApiBuildRequestCode ?? defaults.novelApiBuildRequestCode),
    novelApiMapResponseCode: String(settings.novelApiMapResponseCode ?? defaults.novelApiMapResponseCode),
  };
}

function normalizeProviderBaseURL(type: RuntimeAIConfig['type'], value: string | undefined, fallback: string, hasStoredProviderBaseURLs: boolean): string {
  if (!value)
    return fallback;
  if (!hasStoredProviderBaseURLs && isPresetBaseURL(type, value))
    return fallback;
  return value;
}

function isPresetBaseURL(type: RuntimeAIConfig['type'], value: string): boolean {
  return value === getAIProviderPreset(type).baseURL;
}
