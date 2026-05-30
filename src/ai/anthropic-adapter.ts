/**
 * Anthropic (Claude) 格式 API 适配器
 *
 * 兼容 Anthropic Messages API 格式，包括：
 * - Anthropic Claude (claude-3.5-sonnet, claude-3-opus, etc.)
 * - AWS Bedrock Claude (需调整 baseURL 和 auth)
 */

import type { AIAdapter, AIChatRequest, AIChatResponse, AIProviderConfig } from '@xianxia-rpg/shared';
import { Buffer } from 'node:buffer';
import http from 'node:http';
import https from 'node:https';

export class AnthropicAdapter implements AIAdapter {
  readonly type = 'anthropic' as const;

  async chat(config: AIProviderConfig, request: AIChatRequest): Promise<AIChatResponse> {
    const baseURL = config.baseURL ?? 'https://api.anthropic.com/v1';
    const url = new URL(`${baseURL}/messages`);

    // Anthropic 格式：system 是顶层参数，不在 messages 中
    const systemPrompt = config.systemPrompt ?? '';

    // 构建消息列表（Anthropic 不支持 system role 在 messages 中）
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // 添加历史消息（跳过 system）
    for (const msg of request.messages) {
      if (msg.role === 'system')
        continue;
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: request.userMessage });

    // 构建请求体
    const body = JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens ?? 2048,
      temperature: config.temperature ?? 0.7,
      system: systemPrompt || undefined,
      messages,
    });

    try {
      const responseText = await this.httpRequest(url.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body,
      });

      const data = JSON.parse(responseText);

      if (data.error) {
        return {
          success: false,
          reply: '',
          error: data.error.message ?? JSON.stringify(data.error),
        };
      }

      // Anthropic 返回格式：content 是数组
      const reply
        = data.content
          ?.filter((block: { type: string }) => block.type === 'text')
          .map((block: { text: string }) => block.text)
          .join('') ?? '';

      const usage = data.usage
        ? {
            promptTokens: data.usage.input_tokens as number,
            completionTokens: data.usage.output_tokens as number,
            totalTokens: ((data.usage.input_tokens as number) + (data.usage.output_tokens as number)),
          }
        : undefined;

      return { success: true, reply, usage };
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, reply: '', error: errorMessage };
    }
  }

  /** 通用 HTTP/HTTPS 请求 */
  private httpRequest(
    urlStr: string,
    options: { method: string; headers: Record<string, string>; body: string },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlStr);
      const transport = parsedUrl.protocol === 'https:' ? https : http;

      const req = transport.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method,
          headers: options.headers,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
            else {
              resolve(body);
            }
          });
        },
      );

      req.on('error', reject);
      req.write(options.body);
      req.end();
    });
  }
}
