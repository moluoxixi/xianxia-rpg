export const themeIds = [
  'otome',
  'xianxia',
  'campus',
  'urban',
  'suspense',
  'cyberpunk',
  'fantasy',
  'minguo',
] as const;

export type GameThemeId = typeof themeIds[number];

export type GameThemeSource = 'default' | 'novel-auto' | 'user-override';

export interface GameThemePreset {
  id: GameThemeId;
  label: string;
  tone: string;
  shellClassName: string;
  avatarText: string;
}

export interface ThemeSaveSummary {
  themeId?: string;
  referenceNovel?: string;
  currentScene: string;
  realm: string;
}

export const DEFAULT_THEME_ID: GameThemeId = 'otome';

// 主界面主题只暴露稳定的 UI 契约，具体视觉细节收敛到全局样式变量中。
export const gameThemePresets: Record<GameThemeId, GameThemePreset> = {
  otome: {
    id: 'otome',
    label: '日系乙女',
    tone: '梦幻浅色系',
    shellClassName: 'theme-shell-otome',
    avatarText: '乙',
  },
  xianxia: {
    id: 'xianxia',
    label: '古风仙侠',
    tone: '水墨宣纸',
    shellClassName: 'theme-shell-xianxia',
    avatarText: '仙',
  },
  campus: {
    id: 'campus',
    label: '校园清新',
    tone: '马卡龙浅色',
    shellClassName: 'theme-shell-campus',
    avatarText: '学',
  },
  urban: {
    id: 'urban',
    label: '现代都市',
    tone: '极简轻奢',
    shellClassName: 'theme-shell-urban',
    avatarText: '城',
  },
  suspense: {
    id: 'suspense',
    label: '悬疑灵异',
    tone: '冷色暗纹',
    shellClassName: 'theme-shell-suspense',
    avatarText: '疑',
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: '科幻赛博',
    tone: '霓虹科技',
    shellClassName: 'theme-shell-cyberpunk',
    avatarText: '赛',
  },
  fantasy: {
    id: 'fantasy',
    label: '西方魔幻',
    tone: '暗金皮革',
    shellClassName: 'theme-shell-fantasy',
    avatarText: '魔',
  },
  minguo: {
    id: 'minguo',
    label: '民国复古',
    tone: '旧纸暖黄',
    shellClassName: 'theme-shell-minguo',
    avatarText: '旧',
  },
};

export function getGameThemePreset(themeId: GameThemeId): GameThemePreset {
  return gameThemePresets[themeId];
}

export function normalizeThemeId(value: unknown): GameThemeId {
  return themeIds.includes(value as GameThemeId) ? value as GameThemeId : DEFAULT_THEME_ID;
}

export function normalizeThemeSource(value: unknown): GameThemeSource {
  const sources: GameThemeSource[] = ['default', 'novel-auto', 'user-override'];
  return sources.includes(value as GameThemeSource) ? value as GameThemeSource : 'default';
}

export function inferThemeIdFromNovel(novelTitle: string, description = ''): GameThemeId {
  const text = `${novelTitle}${description}`;

  // 题材推断按最有辨识度的关键词优先匹配，避免泛化词提前吞掉更具体的类型。
  if (hasAnyKeyword(text, ['校园', '青春', '同桌', '学霸', '校花', '学生']))
    return 'campus';
  if (hasAnyKeyword(text, ['都市', '职场', '商战', '豪门', '总裁', '现实']))
    return 'urban';
  if (hasAnyKeyword(text, ['悬疑', '灵异', '惊悚', '恐怖', '盗墓', '诡秘', '克苏鲁']))
    return 'suspense';
  if (hasAnyKeyword(text, ['科幻', '赛博', '星空', '机甲', '末世', '宇宙', '吞噬星空']))
    return 'cyberpunk';
  if (hasAnyKeyword(text, ['西幻', '魔法', '骑士', '龙族', '巫师', '中世纪']))
    return 'fantasy';
  if (hasAnyKeyword(text, ['民国', '谍战', '年代', '旧上海']))
    return 'minguo';
  if (hasAnyKeyword(text, ['修仙', '仙侠', '玄幻', '武侠', '凡人', '遮天', '斗破', '雪中', '炼气', '筑基', '结丹', '元婴']))
    return 'xianxia';
  if (hasAnyKeyword(text, ['乙女', '恋爱', '少女', '日系', '轻小说']))
    return 'otome';

  return DEFAULT_THEME_ID;
}

export function inferThemeIdFromSave(save: ThemeSaveSummary): GameThemeId {
  if (save.themeId)
    return normalizeThemeId(save.themeId);

  return inferThemeIdFromNovel(save.referenceNovel ?? save.currentScene, `${save.realm}${save.currentScene}`);
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}
