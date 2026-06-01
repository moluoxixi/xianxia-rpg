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
    ['遮天', '秘境修行与圣地世家的玄幻世界', 'xianxia'],
    ['乙女恋曲', '日系少女与轻小说感剧情', 'otome'],
  ])('infers %s as %s', (title, description, themeId) => {
    expect(inferThemeIdFromNovel(title, description)).toBe(themeId);
  });

  it('uses the default theme when a save summary does not store themeId', () => {
    expect(inferThemeIdFromSave({ currentScene: '任意场景', realm: '任意身份' })).toBe(DEFAULT_THEME_ID);
  });

  it('keeps explicit save theme ids', () => {
    expect(inferThemeIdFromSave({ themeId: 'urban', currentScene: '中央车站', realm: '调查员' })).toBe('urban');
  });

  it('normalizes invalid values back to the default theme', () => {
    expect(normalizeThemeId('unknown')).toBe(DEFAULT_THEME_ID);
    expect(normalizeThemeSource('unknown')).toBe('default');
  });
});
