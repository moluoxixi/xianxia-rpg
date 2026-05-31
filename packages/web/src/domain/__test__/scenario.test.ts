import { describe, expect, it } from 'vitest';
import { cloneScenarioInitialState } from '../game-data';
import { buildPlayerStatus } from '../game-engine';
import { availableNovelScenarios, createRecommendedNovelSummaries, createScenarioFromNovelTitle, mergeNovelSummaries, normalizeScenarioPack } from '../scenario';

describe('recommended novel summaries', () => {
  it('exposes multiple starter candidates for the searchable novel selector', () => {
    const summaries = createRecommendedNovelSummaries();

    expect(summaries).toHaveLength(availableNovelScenarios.length);
    expect(summaries.length).toBeGreaterThan(1);
    expect(summaries.map(novel => novel.title)).toContain('凡人修仙传');
    expect(summaries.map(novel => novel.title)).toContain('诡秘之主');
  });

  it('keeps recommended candidates before duplicate remote API results', () => {
    const [recommended] = createRecommendedNovelSummaries();
    const merged = mergeNovelSummaries([recommended], [
      {
        ...recommended,
        id: 'remote-duplicate',
        source: 'Open Library',
      },
    ]);

    expect(merged).toEqual([recommended]);
  });
});

describe('scenario normalization', () => {
  it('infers the theme for old saves that do not store themeId yet', () => {
    const normalized = normalizeScenarioPack({
      id: 'legacy-lord-of-mysteries',
      title: '诡秘之主',
      referenceNovel: '诡秘之主',
      description: '序列晋升与克苏鲁风格的悬疑世界。',
      stylePrompt: '',
      openingMessage: '',
      player: { name: '玩家', realm: '凡人', sect: '未定', location: '廷根' },
      initialSceneName: '廷根',
      scenes: {},
    });

    expect(normalized?.gameTypeId).toBe('suspense');
    expect(normalized?.themeId).toBe('suspense');
  });

  it('keeps UI theme separate from the game type used in AI context', () => {
    const scenario = createScenarioFromNovelTitle('诡秘之主', 'otome', 'user-override', 'suspense');
    const state = cloneScenarioInitialState(scenario);
    const status = buildPlayerStatus(state);

    expect(state.themeId).toBe('otome');
    expect(state.gameTypeId).toBe('suspense');
    expect(status).toContain('题材:悬疑/灵异/神秘学');
    expect(status).not.toContain('题材:乙女');
  });
});
