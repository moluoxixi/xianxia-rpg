export const gameTypeIds = [
  'otome',
  'xianxia',
  'campus',
  'urban',
  'suspense',
  'cyberpunk',
  'fantasy',
  'minguo',
] as const;

export type GameTypeId = typeof gameTypeIds[number];

export interface GameTypePreset {
  id: GameTypeId;
  label: string;
  promptLabel: string;
  tone: string;
  ui: GameTypeUiPreset;
}

export interface GameTypeUiPreset {
  rankLabel: string;
  nextRankLabel: string;
  factionLabel: string;
  abilitiesTitle: string;
  abilityItemLabel: string;
  emptyAbilitiesText: string;
}

export const DEFAULT_GAME_TYPE_ID: GameTypeId = 'otome';

// 游戏题材只服务剧本推导与 AI 上下文，不能当作 UI 主题状态使用。
export const gameTypePresets: Record<GameTypeId, GameTypePreset> = {
  otome: {
    id: 'otome',
    label: '日系乙女',
    promptLabel: '乙女恋爱/二次元',
    tone: '柔和、细腻、关系驱动',
    ui: {
      rankLabel: '身份',
      nextRankLabel: '下一关系阶段',
      factionLabel: '关系圈',
      abilitiesTitle: '特质',
      abilityItemLabel: '特质',
      emptyAbilitiesText: '暂无已记录特质',
    },
  },
  xianxia: {
    id: 'xianxia',
    label: '古风仙侠',
    promptLabel: '修仙/玄幻/武侠',
    tone: '境界成长、门派势力、机缘风险',
    ui: {
      rankLabel: '境界',
      nextRankLabel: '下一境界',
      factionLabel: '门派',
      abilitiesTitle: '功法',
      abilityItemLabel: '功法',
      emptyAbilitiesText: '暂无已记录功法',
    },
  },
  campus: {
    id: 'campus',
    label: '校园清新',
    promptLabel: '校园青春',
    tone: '日常关系、成长选择、轻快事件',
    ui: {
      rankLabel: '身份',
      nextRankLabel: '下一成长阶段',
      factionLabel: '班级/社团',
      abilitiesTitle: '特长',
      abilityItemLabel: '特长',
      emptyAbilitiesText: '暂无已记录特长',
    },
  },
  urban: {
    id: 'urban',
    label: '现代都市',
    promptLabel: '现代都市',
    tone: '现实规则、职场社交、资源博弈',
    ui: {
      rankLabel: '身份',
      nextRankLabel: '下一阶段',
      factionLabel: '所属',
      abilitiesTitle: '能力',
      abilityItemLabel: '能力',
      emptyAbilitiesText: '暂无已记录能力',
    },
  },
  suspense: {
    id: 'suspense',
    label: '悬疑灵异',
    promptLabel: '悬疑/灵异/神秘学',
    tone: '线索推进、风险递增、克制揭露',
    ui: {
      rankLabel: '身份',
      nextRankLabel: '下一线索阶段',
      factionLabel: '组织/阵营',
      abilitiesTitle: '线索能力',
      abilityItemLabel: '能力',
      emptyAbilitiesText: '暂无已记录线索能力',
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: '科幻赛博',
    promptLabel: '科幻/赛博朋克',
    tone: '技术系统、城市网络、未来冲突',
    ui: {
      rankLabel: '身份',
      nextRankLabel: '下一同步阶段',
      factionLabel: '阵营',
      abilitiesTitle: '模组',
      abilityItemLabel: '模组',
      emptyAbilitiesText: '暂无已记录模组',
    },
  },
  fantasy: {
    id: 'fantasy',
    label: '西方魔幻',
    promptLabel: '西方魔幻',
    tone: '魔法、骑士、种族势力与冒险',
    ui: {
      rankLabel: '位阶',
      nextRankLabel: '下一位阶',
      factionLabel: '阵营',
      abilitiesTitle: '技能',
      abilityItemLabel: '技能',
      emptyAbilitiesText: '暂无已记录技能',
    },
  },
  minguo: {
    id: 'minguo',
    label: '民国复古',
    promptLabel: '民国/年代/谍战',
    tone: '旧时代关系、身份隐秘、时代压力',
    ui: {
      rankLabel: '身份',
      nextRankLabel: '下一阶段',
      factionLabel: '组织',
      abilitiesTitle: '技艺',
      abilityItemLabel: '技艺',
      emptyAbilitiesText: '暂无已记录技艺',
    },
  },
};

export function getGameTypePreset(gameTypeId: GameTypeId): GameTypePreset {
  return gameTypePresets[gameTypeId];
}

export function normalizeGameTypeId(value: unknown): GameTypeId {
  return gameTypeIds.includes(value as GameTypeId) ? value as GameTypeId : DEFAULT_GAME_TYPE_ID;
}

export function inferGameTypeFromNovel(novelTitle: string, description = ''): GameTypeId {
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

  return DEFAULT_GAME_TYPE_ID;
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}
