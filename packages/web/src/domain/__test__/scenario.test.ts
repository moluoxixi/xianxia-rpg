import { describe, expect, it } from 'vitest';
import { cloneScenarioInitialState } from '../game-data';
import { buildPlayerStatus } from '../game-engine';
import { availableNovelScenarios, createRecommendedNovelSummaries, createScenarioFromNovelTitle, mergeNovelSummaries, normalizeScenarioPack } from '../scenario';

describe('recommended novel summaries', () => {
  it('exposes multiple starter candidates for the searchable novel selector', () => {
    const summaries = createRecommendedNovelSummaries();

    expect(summaries).toHaveLength(availableNovelScenarios.length);
    expect(summaries.length).toBeGreaterThan(1);
    expect(summaries.map(novel => novel.title)).toContain('诡秘之主');
    expect(summaries.map(novel => novel.title)).toContain('遮天');
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

  it('filters removed first-version built-in candidates from remote search results', () => {
    const removedTitle = ['凡人', '修仙', '传'].join('');
    const merged = mergeNovelSummaries([
      {
        id: 'remote-removed-candidate',
        title: removedTitle,
        author: '忘语',
        description: '已移除的首版内置候选。',
        source: 'remote',
      },
    ]);

    expect(merged).toEqual([]);
  });
});

describe('scenario normalization', () => {
  it('uses neutral defaults when generated data does not include UI metadata', () => {
    const normalized = normalizeScenarioPack({
      id: 'generated-lord-of-mysteries',
      title: '诡秘之主',
      referenceNovel: '诡秘之主',
      description: '序列晋升与克苏鲁风格的悬疑世界。',
      stylePrompt: '',
      openingMessage: '',
      player: { name: '玩家', realm: '调查员', sect: '未定', location: '廷根' },
      initialSceneName: '廷根',
      scenes: {},
    });

    expect(normalized?.gameTypeId).toBe('otome');
    expect(normalized?.themeId).toBe('otome');
    expect(normalized?.themeSource).toBe('default');
  });

  it('keeps UI theme separate from the game type used in AI context', () => {
    const scenario = createScenarioFromNovelTitle('诡秘之主', 'otome', 'user-override', 'suspense');
    const state = cloneScenarioInitialState(scenario);
    const status = buildPlayerStatus(state);

    expect(state.themeId).toBe('otome');
    expect(state.gameTypeId).toBe('suspense');
    expect(status).toContain('题材:悬疑/灵异/神秘学');
    expect(status).toContain('身份:');
    expect(status).toContain('体能:');
    expect(status).toContain('理智:');
    expect(status).toContain('线索能力:');
    expect(status).not.toContain('题材:乙女');
    expect(status).not.toContain('气血:');
    expect(status).not.toContain('灵力:');
    expect(status).not.toContain('功法:');
  });
});
