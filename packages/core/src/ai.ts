// ========== AI 接口统一类型定义 ==========

/** 聊天消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant';

/** 通用聊天消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** AI 提供商类型 */
export type AIProviderType = 'openai' | 'anthropic';

/** AI 提供商配置 */
export interface AIProviderConfig {
  /** 提供商类型 */
  type: AIProviderType;
  /** API Base URL：OpenAI 兼容接口通常包含 /v1，Anthropic 使用服务根地址。 */
  baseURL?: string;
  /** API Key */
  apiKey: string;
  /** 模型名称 */
  model: string;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

/** AI 调用请求 */
export interface AIChatRequest {
  /** 对话历史消息 */
  messages: ChatMessage[];
  /** 本次用户输入 */
  userMessage: string;
}

/** AI 调用响应 */
export interface AIChatResponse {
  success: boolean;
  /** AI 回复文本 */
  reply: string;
  /** 使用的 token 数（可选） */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 错误信息 */
  error?: string;
}

/** AI 适配器接口 —— 所有适配器必须实现此接口 */
export interface AIAdapter {
  /** 提供商类型标识 */
  readonly type: AIProviderType;

  /**
   * 发送聊天请求
   * @param config 提供商配置
   * @param request 聊天请求
   * @returns AI 响应
   */
  chat(config: AIProviderConfig, request: AIChatRequest): Promise<AIChatResponse>;
}
