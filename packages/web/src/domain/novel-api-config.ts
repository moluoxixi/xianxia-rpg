import type { NovelApiProvider } from './types';

export const defaultNovelApiBuildRequestCode = `({ baseURL, keyword, apiKey }) => ({
  url: baseURL + '/search?keyword=' + encodeURIComponent(keyword),
  method: 'GET',
  headers: apiKey ? { Authorization: 'Bearer ' + apiKey } : {},
})`;

export const defaultNovelApiMapResponseCode = `({ payload }) => ({
  novels: payload.data.map(item => ({
    id: String(item.id),
    title: String(item.title),
    author: String(item.author),
    description: String(item.description),
    source: 'custom',
  })),
})`;

export function normalizeNovelApiProvider(value: unknown): NovelApiProvider {
  if (value === 'biquge-compatible' || value === 'custom')
    return 'compatible';
  return (value ?? 'disabled') as NovelApiProvider;
}
