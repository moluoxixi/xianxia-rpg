/**
 * AI 统一调用入口
 *
 * 根据配置自动选择对应的适配器，对外暴露统一的 chat 方法。
 * 使用方只需关心 AIProviderConfig 和 AIChatRequest/Response。
 */

import type {
  AIAdapter,
  AIChatRequest,
  AIChatResponse,
  AIProviderConfig,
  AIProviderType,
} from '@xianxia-rpg/core';
import { AnthropicAdapter } from './anthropic-adapter';
import { OpenAIAdapter } from './openai-adapter';

// 适配器注册表
const adapterMap: Record<AIProviderType, AIAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
};

/**
 * 调用 AI 聊天接口
 * @param config AI 提供商配置
 * @param request 聊天请求
 * @returns AI 响应
 */
export async function chatWithAI(
  config: AIProviderConfig,
  request: AIChatRequest,
): Promise<AIChatResponse> {
  const adapter = adapterMap[config.type];
  if (!adapter) {
    return {
      success: false,
      reply: '',
      error: `不支持的 AI 提供商类型: ${config.type}`,
    };
  }
  return adapter.chat(config, request);
}

/**
 * 注册自定义适配器（用于扩展其他格式）
 */
export function registerAdapter(type: AIProviderType, adapter: AIAdapter): void {
  adapterMap[type] = adapter;
}

// 导出类型，供外部使用
export type { AIAdapter, AIChatRequest, AIChatResponse, AIProviderConfig, AIProviderType };
