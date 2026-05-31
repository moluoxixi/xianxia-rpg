import type { AIModelCatalog, AIModelEndpoint, AIModelOption, AIModelProviderPreset, AIModelProviderType, AIModelSettings } from './types';
import { AI_PROVIDER_PRESETS } from './provider-presets';

export function getAIProviderPreset(type: AIModelProviderType): AIModelProviderPreset {
  return AI_PROVIDER_PRESETS[type];
}

export function createProviderModelRows(type: AIModelProviderType): AIModelOption[] {
  return AI_PROVIDER_PRESETS[type].models.map(model => ({ ...model }));
}

export function createDefaultModelCatalog(overrides: Partial<AIModelCatalog> = {}): AIModelCatalog {
  return {
    openai: overrides.openai ?? createProviderModelRows('openai'),
    anthropic: overrides.anthropic ?? createProviderModelRows('anthropic'),
  };
}

export function createDefaultModelSettings(type: AIModelProviderType = 'openai'): AIModelSettings {
  const preset = getAIProviderPreset(type);
  return {
    type,
    baseURL: preset.baseURL,
    model: preset.model,
    maxTokens: preset.maxTokens,
    temperature: preset.temperature,
    modelCatalog: createDefaultModelCatalog(),
  };
}

export function createCustomModelRow(type: AIModelProviderType, sequence: number): AIModelOption {
  return {
    id: `${type}-custom-${sequence}`,
    name: '自定义模型',
  };
}

export function resolveSelectedModelId(model: string, models: AIModelOption[]): string {
  if (models.some(item => item.id === model))
    return model;

  return models[0]?.id ?? model;
}

export function buildAIProviderEndpointUrl(type: AIModelProviderType, baseURL: string | undefined, endpoint: AIModelEndpoint): string {
  const preset = getAIProviderPreset(type);
  const normalizedBaseURL = normalizeProviderBaseURL(type, baseURL ?? preset.baseURL);
  return new URL(preset.endpoints[endpoint], ensureTrailingSlash(normalizedBaseURL)).href;
}

function normalizeProviderBaseURL(type: AIModelProviderType, baseURL: string): string {
  if (type !== 'anthropic')
    return baseURL;

  return normalizeAnthropicBaseURL(baseURL);
}

function normalizeAnthropicBaseURL(baseURL: string): string {
  const url = new URL(baseURL);
  if (url.origin === 'https://api.anthropic.com' && (url.pathname === '/v1' || url.pathname === '/v1/'))
    url.pathname = '/';

  return removeTrailingSlash(url.href);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function removeTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
