import type { NovelSummary } from '@xianxia-rpg/core';
import { describe, expect, it } from 'vitest';
import { isSameNovelSelection, resolveMenuSelectedNovel } from './main-menu-novel-selection';

const lordOfMysteries: NovelSummary = {
  id: 'recommended-lord-of-mysteries',
  title: '诡秘之主',
  author: '爱潜水的乌贼',
  description: '序列晋升、隐秘组织与神秘学风险。',
  source: '推荐小说',
};

const firstSequence: NovelSummary = {
  id: 'remote-first-sequence',
  title: '第一序列',
  author: '会说话的肘子',
  description: '壁垒、荒野、灾变后的生存与成长。',
  source: 'AI 小说识别',
};

describe('main menu novel selection', () => {
  it('keeps the explicitly selected novel when async search results refresh the list', () => {
    expect(resolveMenuSelectedNovel({
      novels: [lordOfMysteries],
      visibleNovels: [],
      selectedNovel: firstSequence,
    })).toEqual(firstSequence);
  });

  it('uses the first visible search result as the default when the user has not selected manually', () => {
    expect(resolveMenuSelectedNovel({
      novels: [lordOfMysteries, firstSequence],
      visibleNovels: [firstSequence],
      selectedNovel: null,
    })).toEqual(firstSequence);
  });

  it('matches the same novel across unstable remote ids', () => {
    expect(isSameNovelSelection(firstSequence, {
      ...firstSequence,
      id: 'remote-first-sequence-refreshed',
    })).toBe(true);
  });
});
