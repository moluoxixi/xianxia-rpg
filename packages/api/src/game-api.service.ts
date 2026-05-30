import type { HostInventoryPinsPayload, HostMessagePayload, HostSettingsPayload } from '@xianxia-rpg/core';
import type { OnModuleInit } from '@nestjs/common';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import type { AIChatRequest, AIProviderConfig } from './ai';
import { chatWithAI } from './ai';
import { createDefaultAIConfig } from './default-ai-config';
import { GameDatabase } from './infrastructure/database';

@Injectable()
export class GameApiService implements OnModuleInit {
  private readonly database = new GameDatabase(path.join(getDataDir(), 'game-runs.sqlite'));

  private readonly aiConfig: AIProviderConfig = createDefaultAIConfig();

  async onModuleInit(): Promise<void> {
    await this.database.init();
    const storedConfig = this.database.loadAIConfig();
    if (storedConfig) {
      Object.assign(this.aiConfig, storedConfig);
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

  async updateAIConfig(config: Partial<AIProviderConfig>): Promise<{ success: boolean; message: string }> {
    Object.assign(this.aiConfig, config);
    return { success: true, message: `AI 配置已更新: ${this.aiConfig.type} / ${this.aiConfig.model}` };
  }

  async saveAIConfig(config: HostSettingsPayload): Promise<{ success: boolean; message: string }> {
    await this.database.init();
    this.database.saveAIConfig(config);
    Object.assign(this.aiConfig, config);
    return { success: true, message: 'AI 配置已保存' };
  }

  async loadAIConfig(): Promise<{ success: boolean; data: AIProviderConfig }> {
    await this.database.init();
    const storedConfig = this.database.loadAIConfig();
    return { success: true, data: { ...this.aiConfig, ...storedConfig } };
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
