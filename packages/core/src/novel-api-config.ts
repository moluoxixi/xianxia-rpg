export type NovelApiProvider = 'disabled' | 'compatible' | 'custom-functions';

export interface NovelApiSettingsPreset {
  novelApiProvider: NovelApiProvider;
  novelApiBaseURL: string;
  novelApiKey: string;
  novelApiBuildRequestCode: string;
  novelApiMapResponseCode: string;
}

export const defaultNovelApiProvider: NovelApiProvider = 'custom-functions';
export const defaultNovelApiBaseURL = 'https://openlibrary.org';
export const defaultNovelApiKey = '';

// Open Library 搜索接口作为默认野外小说来源，保持无 API Key 的试玩闭环。
export const defaultNovelApiBuildRequestCode = `({ baseURL, keyword }) => ({
  url: baseURL + '/search.json?q=' + encodeURIComponent(keyword || '凡人修仙传') + '&limit=12&fields=key,title,author_name,first_publish_year,subject',
  method: 'GET',
  headers: {},
})`;

// 转换函数只产出游戏需要的小说摘要契约，章节内容不进入本项目。
export const defaultNovelApiMapResponseCode = `({ payload }) => ({
  novels: payload.docs.map(item => ({
    id: String(item.key),
    title: String(item.title),
    author: String(item.author_name?.[0] ?? '未知作者'),
    description: [
      item.first_publish_year ? '首版年份：' + String(item.first_publish_year) : 'Open Library 搜索结果',
      item.subject?.slice(0, 4).join(' / ') ?? '',
    ].filter(Boolean).join('；'),
    source: 'Open Library',
  })),
  message: 'Open Library 搜索结果',
})`;

export function createDefaultNovelApiSettings(): NovelApiSettingsPreset {
  return {
    novelApiProvider: defaultNovelApiProvider,
    novelApiBaseURL: defaultNovelApiBaseURL,
    novelApiKey: defaultNovelApiKey,
    novelApiBuildRequestCode: defaultNovelApiBuildRequestCode,
    novelApiMapResponseCode: defaultNovelApiMapResponseCode,
  };
}

export function normalizeNovelApiProvider(value: unknown): NovelApiProvider {
  if (value === 'biquge-compatible' || value === 'custom')
    return 'compatible';
  if (value === 'disabled' || value === 'compatible' || value === 'custom-functions')
    return value;
  return defaultNovelApiProvider;
}
