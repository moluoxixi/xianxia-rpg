import type { HostNovelSearchResult } from '@xianxia-rpg/core';
import { runInNewContext } from 'node:vm';
import { z } from 'zod';

export interface NovelApiSettings {
  novelApiProvider?: string;
  novelApiBaseURL?: string;
  novelApiKey?: string;
  novelApiBuildRequestCode?: string;
  novelApiMapResponseCode?: string;
}

const novelSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: z.string(),
  source: z.string(),
});

const compatibleResultSchema = z.object({
  success: z.boolean(),
  data: z.array(novelSummarySchema),
  message: z.string().optional(),
});

const customRequestSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST']).default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.unknown().optional(),
});

const customResponseSchema = z.object({
  novels: z.array(novelSummarySchema),
  message: z.string().optional(),
});

interface NovelRequestContext {
  apiKey: string;
  baseURL: string;
  keyword: string;
}

interface NovelResponseContext {
  keyword: string;
  payload: unknown;
}

export async function searchRemoteNovels(settings: NovelApiSettings, keyword: string): Promise<HostNovelSearchResult> {
  if (!settings.novelApiBaseURL)
    return { success: false, data: [], message: '小说 API Base URL 未配置' };

  if (settings.novelApiProvider === 'custom-functions')
    return searchWithCustomFunctions(settings, keyword);

  return searchCompatibleNovels(settings, keyword);
}

async function searchCompatibleNovels(settings: NovelApiSettings, keyword: string): Promise<HostNovelSearchResult> {
  try {
    const response = await fetch(createCompatibleSearchUrl(settings.novelApiBaseURL as string), {
      method: 'POST',
      headers: createJsonHeaders(settings),
      body: JSON.stringify({ keyword }),
    });
    if (!response.ok)
      return { success: false, data: [], message: `小说兼容 API 请求失败：HTTP ${response.status}` };

    return compatibleResultSchema.parse(await response.json());
  }
  catch (error) {
    return { success: false, data: [], message: `小说兼容 API 请求失败：${error instanceof Error ? error.message : String(error)}` };
  }
}

async function searchWithCustomFunctions(settings: NovelApiSettings, keyword: string): Promise<HostNovelSearchResult> {
  if (!settings.novelApiBuildRequestCode || !settings.novelApiMapResponseCode)
    return { success: false, data: [], message: '函数适配模式需要填写请求转换函数和响应转换函数' };

  try {
    const request = customRequestSchema.parse(runUserFunction<NovelRequestContext>(
      settings.novelApiBuildRequestCode,
      { apiKey: settings.novelApiKey ?? '', baseURL: settings.novelApiBaseURL as string, keyword },
    ));
    const response = await fetch(request.url, createRequestInit(request));
    if (!response.ok)
      return { success: false, data: [], message: `小说函数 API 请求失败：HTTP ${response.status}` };

    const mapped = customResponseSchema.parse(runUserFunction<NovelResponseContext>(
      settings.novelApiMapResponseCode,
      { keyword, payload: await response.json() },
    ));
    return { success: true, data: mapped.novels, message: mapped.message };
  }
  catch (error) {
    return { success: false, data: [], message: `小说函数 API 请求失败：${error instanceof Error ? error.message : String(error)}` };
  }
}

function createCompatibleSearchUrl(baseURL: string): string {
  return `${baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL}/novels/search`;
}

function createJsonHeaders(settings: NovelApiSettings): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.novelApiKey) {
    headers.Authorization = `Bearer ${settings.novelApiKey}`;
    headers['X-API-Key'] = settings.novelApiKey;
  }
  return headers;
}

function createRequestInit(request: z.infer<typeof customRequestSchema>): { body?: string; headers?: Record<string, string>; method: 'GET' | 'POST' } {
  if (request.method === 'GET')
    return { method: request.method, headers: request.headers };

  return {
    method: request.method,
    headers: { 'Content-Type': 'application/json', ...request.headers },
    body: JSON.stringify(request.body ?? {}),
  };
}

function runUserFunction<TContext>(code: string, context: TContext): unknown {
  return runInNewContext(
    `"use strict"; const transform = ${code}; transform(context);`,
    { context, encodeURIComponent },
    { timeout: 1000 },
  );
}
