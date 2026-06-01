import { describe, expect, it } from 'vitest';
import { cloneScenarioInitialState } from '../game-data';
import { applyResourceChanges, buildPlayerStatus } from '../game-engine';
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
    expect(status).toContain('属性:状态:80/80 行动力:80/100 进展:0/100');
    expect(status).toContain('线索能力:');
    expect(status).not.toContain('题材:乙女');
    expect(status).not.toContain('体能:');
    expect(status).not.toContain('理智:');
    expect(status).not.toContain('气血:');
    expect(status).not.toContain('灵力:');
    expect(status).not.toContain('功法:');
  });

  it('uses AI generated character attributes instead of game type stat labels', () => {
    const scenario = createScenarioFromNovelTitle('第一序列', 'cyberpunk', 'novel-auto', 'cyberpunk', {
      title: '第一序列开局',
      description: '荒野聚居地里的少年求生故事。',
      stylePrompt: '荒野、秩序崩坏、谨慎成长。',
      openingMessage: '你在集镇边缘醒来。',
      player: { name: '任小粟', realm: '流民少年', sect: '集镇', location: '集镇边缘' },
      attributes: [
        { key: 'vital_signs', label: '生命体征', value: 76, max: 90, statKey: 'hp' },
        { key: 'mental_focus', label: '精神专注', value: 42, max: 80, statKey: 'mp' },
        { key: 'shelter_trust', label: '避难所信任', value: 5, max: 100, statKey: 'exp' },
      ],
      initialSceneName: '集镇边缘',
      scenes: [
        { name: '集镇边缘', type: 'town', region: '113号壁垒外', description: '尘土和棚屋挤在一起。', connectedScenes: [], npcs: [], availableResources: [], isDangerous: false },
      ],
      npcs: [],
      inventory: [{ name: '旧水壶', count: 1, type: 'misc', rarity: 'common' }],
      skills: [{ name: '荒野直觉', level: '入门', type: 'support', proficiency: 0 }],
      quickActions: ['观察四周', '寻找水源', '询问消息', '整理背包'],
    });
    const state = cloneScenarioInitialState(scenario);
    const status = buildPlayerStatus(state);

    expect(state.stats.hp).toBe(76);
    expect(state.stats.maxHp).toBe(90);
    expect(status).toContain('生命体征:76/90');
    expect(status).toContain('精神专注:42/80');
    expect(status).toContain('避难所信任:5/100');
    expect(status).not.toContain('机体完整度');
    expect(status).not.toContain('同步率');
  });

  it('allows AI resource changes to rename and update stored attributes', () => {
    const scenario = createScenarioFromNovelTitle('第一序列');
    const state = cloneScenarioInitialState(scenario);
    const result = applyResourceChanges(state, [
      { type: 'attribute_update', attribute_stat_key: 'hp', attribute_label: '机体完整度', attribute_value: 64, attribute_max: 100 },
    ]);

    expect(result.nextState.stats.hp).toBe(64);
    expect(result.nextState.stats.maxHp).toBe(100);
    expect(result.nextState.attributes.find(attribute => attribute.statKey === 'hp')?.label).toBe('机体完整度');
    expect(buildPlayerStatus(result.nextState)).toContain('机体完整度:64/100');
  });
});
