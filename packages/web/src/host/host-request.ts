import type {
  HostRequestMethod,
  HostRequestPath,
} from '@xianxia-rpg/core';

interface HostRequestOptions<TBody> {
  method: HostRequestMethod;
  body?: TBody;
}

/**
 * 前端统一请求入口：业务层只关心同一组路径，网页端和 Electron
 * 桌面壳都通过 Nest HTTP API 访问后端能力。
 */
export function requestHost<TResult, TBody = unknown>(
  path: HostRequestPath,
  options: HostRequestOptions<TBody>,
): Promise<TResult> {
  return requestHttpHost<TResult, TBody>(path, options);
}

async function requestHttpHost<TResult, TBody>(
  path: HostRequestPath,
  options: HostRequestOptions<TBody>,
): Promise<TResult> {
  const init: RequestInit = { method: options.method };

  if (options.method === 'POST') {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(resolveHostUrl(path), init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`${path} 未返回 JSON，请确认 Web 后端 API 已接入`);
  }

  return await response.json() as TResult;
}

function resolveHostUrl(path: HostRequestPath): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return apiBaseUrl ? `${normalizeBaseUrl(apiBaseUrl)}${path}` : path;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}
