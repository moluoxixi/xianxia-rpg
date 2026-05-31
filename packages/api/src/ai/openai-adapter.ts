/**
 * OpenAI 格式 API 适配器
 *
 * 兼容所有采用 OpenAI Chat Completions API 格式的服务商，包括：
 * - OpenAI 官方 (GPT-4, GPT-4o, etc.)
 * - 通义千问 (DashScope)
 * - DeepSeek
 * - Moonshot (月之暗面)
 * - 百度文心一言 (部分兼容)
 * - 腾讯混元 (部分兼容)
 * - 零一万物 (Yi)
 * - 其他兼容 OpenAI 格式的服务商
 */

import type { AIAdapter, AIChatRequest, AIChatResponse, AIProviderConfig } from '@xianxia-rpg/core';
import { buildAIProviderEndpointUrl } from '@xianxia-rpg/model';
import { Buffer } from 'node:buffer';
import http from 'node:http';
import https from 'node:https';

export class OpenAIAdapter implements AIAdapter {
  readonly type = 'openai' as const;

  async chat(config: AIProviderConfig, request: AIChatRequest): Promise<AIChatResponse> {
    const url = new URL(buildAIProviderEndpointUrl('openai', config.baseURL, 'chat'));

    // 构建消息列表
    const messages: Array<{ role: string; content: string }> = [];

    // 如果有系统提示词，添加到消息头部
    if (config.systemPrompt) {
      messages.push({ role: 'system', content: config.systemPrompt });
    }

    // 添加历史消息
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: request.userMessage });

    // 构建请求体
    const body = JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens ?? 2048,
      temperature: config.temperature ?? 0.7,
    });

    try {
      const responseText = await this.httpRequest(url.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
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

      const reply = data.choices?.[0]?.message?.content ?? '';
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens as number,
            completionTokens: data.usage.completion_tokens as number,
            totalTokens: data.usage.total_tokens as number,
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
