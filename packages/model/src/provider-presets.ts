import type { AIModelProviderPreset, AIModelProviderType } from './types';

export const AI_PROVIDER_PRESETS: Record<AIModelProviderType, AIModelProviderPreset> = {
  openai: {
    type: 'openai',
    label: 'OpenAI / 兼容接口',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-5.2',
    maxTokens: 2048,
    temperature: 0.7,
    endpoints: {
      chat: 'chat/completions',
      models: 'models',
    },
    models: [
      { id: 'gpt-5.2', name: 'GPT-5.2' },
      { id: 'gpt-5.1', name: 'GPT-5.1' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
    ],
  },
  anthropic: {
    type: 'anthropic',
    label: 'Anthropic Claude',
    baseURL: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2048,
    temperature: 0.7,
    endpoints: {
      chat: 'v1/messages',
      models: 'v1/models',
    },
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude Haiku 3.5' },
    ],
  },
};
