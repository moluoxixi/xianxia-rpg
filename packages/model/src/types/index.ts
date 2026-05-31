export type AIModelProviderType = 'openai' | 'anthropic';

export type AIModelEndpoint = 'chat' | 'models';

export interface AIModelOption {
  /** 发送给供应商 API 的真实模型 id。 */
  id: string;
  /** 设置页和下拉框展示给玩家看的模型名称。 */
  name: string;
}

export type AIModelCatalog = Record<AIModelProviderType, AIModelOption[]>;

export interface AIModelProviderPreset {
  type: AIModelProviderType;
  label: string;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
  endpoints: Record<AIModelEndpoint, string>;
  models: AIModelOption[];
}

export interface AIModelSettings {
  type: AIModelProviderType;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
  modelCatalog: AIModelCatalog;
}
