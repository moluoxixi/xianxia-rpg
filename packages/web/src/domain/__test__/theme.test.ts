import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_ID, gameThemePresets, inferThemeIdFromNovel, inferThemeIdFromSave, normalizeThemeId, normalizeThemeSource, themeIds } from '../theme';

describe('theme presets', () => {
  it('covers all expected themes', () => {
    expect(themeIds).toHaveLength(8);
    expect(Object.keys(gameThemePresets)).toEqual(themeIds);
    expect(DEFAULT_THEME_ID).toBe('otome');
  });
});

describe('theme inference', () => {
  it.each([
    ['校园日记', '学霸与同桌的青春故事', 'campus'],
    ['都市白领', '职场商战与现实生活', 'urban'],
    ['灵异档案', '悬疑惊悚与旧楼传闻', 'suspense'],
    ['赛博星门', '科幻机甲与宇宙远征', 'cyberpunk'],
    ['龙与骑士', '西幻魔法与中世纪冒险', 'fantasy'],
    ['旧上海往事', '民国谍战与年代风云', 'minguo'],
    ['凡人修仙传', '炼气筑基结丹元婴一路修行', 'xianxia'],
    ['乙女恋曲', '日系少女与轻小说感剧情', 'otome'],
  ])('infers %s as %s', (title, description, themeId) => {
    expect(inferThemeIdFromNovel(title, description)).toBe(themeId);
  });

  it('falls back to xianxia for old save data with cultivation realm text', () => {
    expect(inferThemeIdFromSave({ currentScene: '练功房', realm: '炼气期一层' })).toBe('xianxia');
  });

  it('keeps explicit save theme ids', () => {
    expect(inferThemeIdFromSave({ themeId: 'urban', currentScene: '练功房', realm: '炼气期一层' })).toBe('urban');
  });

  it('normalizes invalid values back to the default theme', () => {
    expect(normalizeThemeId('unknown')).toBe(DEFAULT_THEME_ID);
    expect(normalizeThemeSource('unknown')).toBe('default');
  });
});
