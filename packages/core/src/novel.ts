export interface NovelSearchPayload {
  keyword: string;
}

export interface NovelSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  source: string;
}

export interface HostNovelSearchResult {
  success: boolean;
  data: NovelSummary[];
  message?: string;
}
