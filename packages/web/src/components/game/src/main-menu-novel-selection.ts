import type { NovelSummary } from '@xianxia-rpg/core';

interface ResolveMenuSelectedNovelOptions {
  novels: NovelSummary[];
  visibleNovels: NovelSummary[];
  selectedNovel: NovelSummary | null;
}

export function resolveMenuSelectedNovel({ novels, visibleNovels, selectedNovel }: ResolveMenuSelectedNovelOptions): NovelSummary | undefined {
  if (selectedNovel)
    return novels.find(novel => isSameNovelSelection(novel, selectedNovel)) ?? selectedNovel;

  // 搜索框已经过滤出候选时，默认选择用户当前看见的第一项，避免被推荐列表第一项抢走。
  return visibleNovels[0] ?? novels[0];
}

export function isSameNovelSelection(left: NovelSummary, right: NovelSummary | undefined): boolean {
  return !!right && createNovelSelectionKey(left) === createNovelSelectionKey(right);
}

function createNovelSelectionKey(novel: Pick<NovelSummary, 'title' | 'author'>): string {
  return `${novel.title}::${novel.author}`.toLocaleLowerCase('zh-CN');
}
