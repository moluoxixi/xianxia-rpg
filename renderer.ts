// ========== 渲染进程逻辑 ==========

import { resolveCombat } from './src/types/combat';
import type { Scene, NPC } from './src/types/scene';
import { INITIAL_SCENE } from './src/types/scene';

// 扩展 Window 接口，声明 gameAPI 类型
interface GameAPIType {
  sendMessage: (payload: {
    message: string;
    history: Array<{ role: string; content: string }>;
  }) => Promise<{ success: boolean; reply: string; error?: string }>;
  saveGame: (data: unknown) => Promise<{ success: boolean; message: string }>;
  loadGame: () => Promise<{ success: boolean; data: unknown }>;
  updateAIConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  saveAIConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  loadAIConfig: () => Promise<{ success: boolean; data: unknown }>;
  testAIConnection: (config: Record<string, unknown>) => Promise<{ success: boolean; reply?: string; error?: string }>;
  saveDeathArchive: (data: unknown) => Promise<{ success: boolean; message: string }>;
}

declare global {
  interface Window {
    gameAPI: GameAPIType;
  }
}

export {}; // 使文件成为模块以支持 import 和 declare global

// ========== 类型定义 ==========

interface CharacterInfo {
  name: string;
  realm: string;
  sect: string;
  location: string;
}

interface CharacterStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
}

interface InventoryItem {
  name: string;
  count: number;
}

interface Skill {
  name: string;
  level: string;
}

interface GameState {
  character: CharacterInfo;
  stats: CharacterStats;
  inventory: InventoryItem[];
  skills: Skill[];
  chatHistory: Array<{ role: string; content: string }>;
  difficulty: 'normal' | 'hard';
  isDead: boolean;
  // 场景系统
  currentScene: string;           // 当前场景名称
  scenes: Record<string, Scene>;  // 已解锁的场景（key=场景名称）
  npcs: Record<string, NPC>;      // 已遇到的 NPC（key=NPC ID）
  defeatedNpcs: string[];         // 已击败的 NPC ID
}

// ========== 道具描述 & 图标数据库 ==========
const ITEM_DESCRIPTIONS: Record<string, string> = {
  '黄龙丹': '恢复50点气血的初级丹药',
  '回灵丹': '恢复30点灵力的丹药',
  '筑基丹': '突破至筑基期所需的珍贵丹药',
  '结丹丸': '结丹期修士修炼辅助丹药',
  '下品灵石': '修仙界通用货币，可用于购买物品',
  '中品灵石': '等价100下品灵石，高阶交易货币',
  '上品灵石': '等价100中品灵石，极为珍贵',
  '长剑': '普通铁剑，攻击力+5',
  '飞剑': '法器级飞剑，可御剑飞行',
  '护身符': '一次性防御道具，抵挡一次致命攻击',
  '储物袋': '可存储物品的空间法器',
  '灵草': '炼丹基础材料',
  '铁精': '炼器基础材料',
  '妖兽内丹': '妖兽体内的精华结晶，炼丹珍贵材料',
};

const ITEM_ICONS: Record<string, string> = {
  '黄龙丹': '💊', '回灵丹': '💊', '筑基丹': '✨', '结丹丸': '✨',
  '下品灵石': '💎', '中品灵石': '💎', '上品灵石': '💎',
  '长剑': '🗡️', '飞剑': '⚔️', '护身符': '🛡️', '储物袋': '👜',
  '灵草': '🌿', '铁精': '⛏️', '妖兽内丹': '🔮',
};

/** 获取物品图标 */
function getItemIcon(name: string): string {
  return ITEM_ICONS[name] ?? '📦';
}

/** 常驻物品列表（右侧面板固定显示） */
const PINNED_ITEMS = ['下品灵石', '黄龙丹', '长剑'];

// ========== DOM 元素引用 ==========

const chatMessages = document.getElementById('chat-messages')!;
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const btnSend = document.getElementById('btn-send')!;
const btnSave = document.getElementById('btn-save')!;
const btnLoad = document.getElementById('btn-load')!;

// ========== 游戏状态 ==========

const gameState: GameState = {
  character: {
    name: '韩立',
    realm: '炼气期一层',
    sect: '七玄门',
    location: '外门居所',
  },
  stats: {
    hp: 100,
    maxHp: 100,
    mp: 80,
    maxMp: 100,
    exp: 10,
    maxExp: 100,
  },
  inventory: [
    { name: '黄龙丹', count: 3 },
    { name: '下品灵石', count: 50 },
    { name: '长剑', count: 1 },
  ],
  skills: [
    { name: '长春功', level: '入门' },
    { name: '基础剑术', level: '熟练' },
  ],
  chatHistory: [],
  difficulty: 'normal',
  isDead: false,
  currentScene: INITIAL_SCENE.name,
  scenes: { [INITIAL_SCENE.name]: INITIAL_SCENE },
  npcs: {},
  defeatedNpcs: [],
};

// ========== 工具函数 ==========

function getTimeStr(): string {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function addMessage(text: string, type: 'player' | 'ai' | 'system'): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;

  const avatar = type === 'player' ? '🧑' : type === 'system' ? '📜' : '🤖';
  const senderName =
    type === 'player' ? gameState.character.name : type === 'system' ? '天道' : 'AI';

  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="sender-name">${senderName}</span>
        <span class="message-time">${getTimeStr()}</span>
      </div>
      <div class="message-text">${text}</div>
    </div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateResourcePanel(): void {
  // 角色信息
  document.getElementById('char-name')!.textContent = gameState.character.name;
  document.getElementById('char-realm')!.textContent = gameState.character.realm;
  document.getElementById('char-sect')!.textContent = gameState.character.sect;
  document.getElementById('char-location')!.textContent = gameState.character.location;

  // 属性条
  const { hp, maxHp, mp, maxMp, exp, maxExp } = gameState.stats;
  document.getElementById('bar-hp')!.style.width = `${(hp / maxHp) * 100}%`;
  document.getElementById('val-hp')!.textContent = `${hp}/${maxHp}`;
  document.getElementById('bar-mp')!.style.width = `${(mp / maxMp) * 100}%`;
  document.getElementById('val-mp')!.textContent = `${mp}/${maxMp}`;
  document.getElementById('bar-exp')!.style.width = `${(exp / maxExp) * 100}%`;
  document.getElementById('val-exp')!.textContent = `${exp}/${maxExp}`;

  // 背包（常驻物品快捷栏）
  const inventoryList = document.getElementById('inventory-list')!;
  inventoryList.innerHTML = '';
  PINNED_ITEMS.forEach((pinnedName) => {
    const item = gameState.inventory.find((i) => i.name === pinnedName);
    const div = document.createElement('div');
    const hasItem = !!item;

    div.className = hasItem
      ? 'px-2 py-1.5 bg-secondary rounded text-xs text-center text-foreground/80 relative cursor-default select-none'
      : 'px-2 py-1.5 bg-secondary rounded text-xs text-center text-muted-foreground/30';
    div.textContent = `${getItemIcon(pinnedName)} ${pinnedName}${hasItem ? ` ×${item.count}` : ''}`;

    if (hasItem) {
      // 悬浮 0.5s 延迟 tooltip
      let hoverTimer: ReturnType<typeof setTimeout> | null = null;
      const tooltip = document.createElement('div');
      tooltip.className = 'pinned-tooltip';
      tooltip.textContent = ITEM_DESCRIPTIONS[pinnedName] ?? '未知物品';
      div.appendChild(tooltip);

      div.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => tooltip.classList.add('visible'), 500);
      });
      div.addEventListener('mouseleave', () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        tooltip.classList.remove('visible');
      });

      // 右键菜单
      div.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        if (hoverTimer) clearTimeout(hoverTimer);
        tooltip.classList.remove('visible');
        showContextMenu(e.clientX, e.clientY, item, gameState.inventory.indexOf(item));
      });
    }

    inventoryList.appendChild(div);
  });

  // 功法
  const skillList = document.getElementById('skill-list')!;
  skillList.innerHTML = '';
  gameState.skills.forEach((skill) => {
    const div = document.createElement('div');
    div.className = 'skill-item';
    div.textContent = `${skill.name}（${skill.level}）`;
    skillList.appendChild(div);
  });
}

// ========== 资源变化解析器 ==========

/** 单条资源变化指令 */
interface ResourceChange {
  type: 'item_add' | 'item_remove' | 'hp' | 'mp' | 'exp' | 'realm' | 'location' | 'skill_add' | 'skill_levelup' | 'combat' | 'scene_define' | 'npc_add' | 'npc_update' | 'favorability';
  name?: string;
  count?: number;
  value?: string | number;
  level?: string;
  // combat 专用字段
  opponent?: string;
  opponent_attack?: number;
  opponent_defense?: number;
  opponent_hp?: number;
  // scene_define 专用字段
  scene_name?: string;
  scene_type?: string;
  scene_region?: string;
  scene_description?: string;
  scene_connected?: string[];
  scene_resources?: string[];
  scene_dangerous?: boolean;
  // npc_add/npc_update 专用字段
  npc_id?: string;
  npc_name?: string;
  npc_role?: string;
  npc_realm?: string;
  npc_sect?: string;
  npc_description?: string;
  npc_attackable?: boolean;
  npc_attack?: number;
  npc_defense?: number;
  npc_maxhp?: number;
  npc_location?: string;
  // favorability 专用字段
  target_npc?: string;
  favor_change?: number;
}

/** 解析结果 */
interface ParseResult {
  /** 去除资源标记后的纯文本（用于显示） */
  cleanText: string;
  /** 解析出的资源变化列表 */
  changes: ResourceChange[];
}

/**
 * 从 AI 回复中解析 [资源变化] 标记
 * 返回去除标记后的纯文本 + 变化列表
 */
function parseResourceChanges(aiReply: string): ParseResult {
  const result: ParseResult = { cleanText: aiReply, changes: [] };

  // 匹配 [资源变化] 后面跟 JSON 内容
  const markerPattern = /\[资源变化\]\s*\n?([\s\S]*?)(?=\n\n|\n*$)/;
  const match = aiReply.match(markerPattern);

  if (!match) return result;

  let jsonStr = match[1].trim();

  // 尝试提取 JSON（可能被包裹在 ```json ... ``` 中）
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const changes = parsed.changes as ResourceChange[];
    if (Array.isArray(changes)) {
      result.changes = changes;
    }
  } catch {
    // JSON 解析失败，尝试更宽松的匹配
    // 尝试从整段文本中提取 JSON 对象
    const jsonMatch = aiReply.match(/\{[\s\S]*"changes"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const changes = parsed.changes as ResourceChange[];
        if (Array.isArray(changes)) {
          result.changes = changes;
        }
      } catch {
        // 最终解析失败，忽略
      }
    }
  }

  // 从显示文本中移除 [资源变化] 标记块
  result.cleanText = aiReply
    .replace(/\[资源变化\]\s*\n?[\s\S]*?(?=\n\n|\n*$)/, '')
    .replace(/```(?:json)?[\s\S]*?```/g, '')
    .trim();

  return result;
}

/**
 * 将解析出的资源变化应用到游戏状态
 * 返回变化摘要文本（用于系统提示）
 */
function applyResourceChanges(changes: ResourceChange[]): string {
  const summaries: string[] = [];

  for (const change of changes) {
    switch (change.type) {
      case 'item_add': {
        const name = change.name ?? '未知物品';
        const count = change.count ?? 1;
        // 境界门槛校验
        const access = _checkResourceAccess(name);
        if (!access.canUse) {
          summaries.push(`⚠️ 获得 ${name} ×${count}，但${access.reason}`);
        } else {
          summaries.push(`📦 获得 ${name} ×${count}`);
        }
        const existing = gameState.inventory.find((item) => item.name === name);
        if (existing) {
          existing.count += count;
        } else {
          gameState.inventory.push({ name, count });
        }
        break;
      }
      case 'item_remove': {
        const name = change.name ?? '未知物品';
        const count = change.count ?? 1;
        const idx = gameState.inventory.findIndex((item) => item.name === name);
        if (idx !== -1) {
          gameState.inventory[idx].count -= count;
          if (gameState.inventory[idx].count <= 0) {
            gameState.inventory.splice(idx, 1);
          }
        }
        summaries.push(`📦 失去 ${name} ×${count}`);
        break;
      }
      case 'hp': {
        const val = typeof change.value === 'number' ? change.value : 0;
        gameState.stats.hp = Math.max(0, Math.min(gameState.stats.maxHp, val));
        summaries.push(`❤️ 气血 → ${gameState.stats.hp}`);
        break;
      }
      case 'mp': {
        const val = typeof change.value === 'number' ? change.value : 0;
        gameState.stats.mp = Math.max(0, Math.min(gameState.stats.maxMp, val));
        summaries.push(`💧 灵力 → ${gameState.stats.mp}`);
        break;
      }
      case 'exp': {
        const val = typeof change.value === 'number' ? change.value : 0;
        gameState.stats.exp = Math.max(0, Math.min(gameState.stats.maxExp, val));
        summaries.push(`✨ 修为 → ${gameState.stats.exp}/${gameState.stats.maxExp}`);
        break;
      }
      case 'realm': {
        const newRealm = String(change.value ?? '');
        if (newRealm) {
          const oldRealm = gameState.character.realm;
          gameState.character.realm = newRealm;
          // 突破时提升 maxHp/maxMp
          gameState.stats.maxHp += 20;
          gameState.stats.maxMp += 20;
          gameState.stats.hp = gameState.stats.maxHp;
          gameState.stats.mp = gameState.stats.maxMp;
          gameState.stats.exp = 0;
          summaries.push(`🎊 境界突破：${oldRealm} → ${newRealm}`);
          // 触发突破动画
          showBreakthroughAnimation(newRealm);
        }
        break;
      }
      case 'location': {
        const newLoc = String(change.value ?? '');
        if (newLoc) {
          gameState.character.location = newLoc;
          gameState.currentScene = newLoc;
          // 如果场景不存在，自动创建一个基础场景
          if (!gameState.scenes[newLoc]) {
            gameState.scenes[newLoc] = {
              name: newLoc,
              type: 'wild',
              region: gameState.character.sect ?? '',
              description: '',
              connectedScenes: [],
              npcs: [],
              availableResources: [],
              isDangerous: false,
            };
          }
          summaries.push(`📍 位置 → ${newLoc}`);
        }
        break;
      }
      case 'skill_add': {
        const name = change.name ?? '未知功法';
        const level = change.level ?? '入门';
        const exists = gameState.skills.find((s) => s.name === name);
        if (!exists) {
          gameState.skills.push({ name, level });
          summaries.push(`📖 学习功法：${name}（${level}）`);
        }
        break;
      }
      case 'skill_levelup': {
        const name = change.name ?? '';
        const level = change.level ?? '';
        const skill = gameState.skills.find((s) => s.name === name);
        if (skill && level) {
          const oldLevel = skill.level;
          skill.level = level;
          summaries.push(`📖 ${name}：${oldLevel} → ${level}`);
        }
        break;
      }
      case 'combat': {
        const opponent = change.opponent ?? '未知对手';
        const oppAtk = change.opponent_attack ?? 10;
        const oppDef = change.opponent_defense ?? 5;
        const oppHp = change.opponent_hp ?? 30;
        const combatLog = executeCombatFromAI(opponent, oppAtk, oppDef, oppHp);
        summaries.push(combatLog);
        break;
      }
      case 'scene_define': {
        const sceneName = change.scene_name ?? '';
        if (sceneName) {
          const newScene: Scene = {
            name: sceneName,
            type: (change.scene_type as Scene['type']) ?? 'wild',
            region: change.scene_region ?? '',
            description: change.scene_description ?? '',
            connectedScenes: change.scene_connected ?? [],
            npcs: [],
            availableResources: change.scene_resources ?? [],
            isDangerous: change.scene_dangerous ?? false,
          };
          gameState.scenes[sceneName] = newScene;
          summaries.push(`🗺️ 发现新场景：${sceneName}（${newScene.type === 'dungeon' ? '副本' : newScene.type === 'sect' ? '宗门' : newScene.type === 'town' ? '城镇' : '野外'}）`);
        }
        break;
      }
      case 'npc_add': {
        const npcId = change.npc_id ?? `npc_${Date.now()}`;
        const npcName = change.npc_name ?? '未知人物';
        const newNpc: NPC = {
          id: npcId,
          name: npcName,
          role: (change.npc_role as NPC['role']) ?? 'story',
          location: change.npc_location ?? gameState.currentScene,
          realm: change.npc_realm ?? '凡人',
          sect: change.npc_sect,
          favorability: 0,
          attackable: change.npc_attackable ?? false,
          description: change.npc_description ?? '',
          combat: change.npc_attackable && change.npc_attack ? {
            attack: change.npc_attack ?? 10,
            defense: change.npc_defense ?? 5,
            hp: change.npc_maxhp ?? 50,
            maxHp: change.npc_maxhp ?? 50,
          } : undefined,
        };
        gameState.npcs[npcId] = newNpc;
        // 将 NPC 添加到当前场景
        if (gameState.scenes[gameState.currentScene]) {
          gameState.scenes[gameState.currentScene].npcs.push(npcId);
        }
        summaries.push(`👤 遇到 ${npcName}（${newNpc.role === 'enemy' ? '敌人' : newNpc.role === 'merchant' ? '商人' : newNpc.role === 'mentor' ? '导师' : '剧情人物'}）`);
        break;
      }
      case 'npc_update': {
        const npcId = change.npc_id ?? '';
        const npc = gameState.npcs[npcId];
        if (npc) {
          if (change.npc_location) npc.location = change.npc_location;
          if (change.npc_description) npc.description = change.npc_description;
          summaries.push(`📝 ${npc.name} 信息更新`);
        }
        break;
      }
      case 'favorability': {
        const targetId = change.target_npc ?? '';
        const favorChange = change.favor_change ?? 0;
        const npc = gameState.npcs[targetId];
        if (npc) {
          npc.favorability = Math.max(-100, Math.min(100, npc.favorability + favorChange));
          const favorText = favorChange > 0 ? '好感度提升' : '好感度下降';
          summaries.push(`💬 ${npc.name} ${favorText} ${Math.abs(favorChange)}（当前：${npc.favorability}）`);
        }
        break;
      }
    }
  }

  return summaries.join('\n');
}

// ========== 选项解析器 ==========

/**
 * 从 AI 回复中解析选项列表
 * 匹配格式：1) 文本  或  1、文本  或  1. 文本
 */
function parseChoices(text: string): Array<{ index: number; text: string }> {
  const choices: Array<{ index: number; text: string }> = [];
  // 匹配：数字 + )/）/、/. + 空格 + 文字内容
  const regex = /^\s*(\d+)\s*[)）、.．]\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    choices.push({
      index: parseInt(match[1], 10),
      text: match[2].trim(),
    });
  }
  return choices;
}

/**
 * 从显示文本中移除选项行
 */
function stripChoicesFromText(text: string): string {
  return text
    .replace(/^\s*\d+\s*[)）、.．]\s*.+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ========== 快捷指令解析器 ==========

/**
 * 从 AI 回复中解析 [快捷指令] 标记
 * 格式：[快捷指令]{"actions":["操作1","操作2"]}
 */
function parseQuickActions(text: string): string[] {
  const regex = /\[快捷指令\]\s*(\{[\s\S]*?\})/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data.actions && Array.isArray(data.actions)) {
        return data.actions;
      }
    } catch {
      // JSON 解析失败，忽略
    }
  }
  return [];
}

/**
 * 从显示文本中移除 [快捷指令] 标记
 */
function stripQuickActionsFromText(text: string): string {
  return text.replace(/\[快捷指令\]\s*\{[\s\S]*?\}/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

// ========== 战斗系统 ==========

/** 执行战斗判定（使用 AI 提供的对手数值），返回战斗描述文本 */
function executeCombatFromAI(
  opponentName: string,
  opponentAttack: number,
  opponentDefense: number,
  opponentHp: number,
): string {
  const difficultyMult = gameState.difficulty === 'hard' ? 1.5 : 0.8;

  // 玩家基础攻击力（根据境界估算）
  const playerAttack = 10 + gameState.stats.maxHp * 0.1;
  const playerDefense = 5 + gameState.stats.maxHp * 0.05;

  const log = resolveCombat(
    playerAttack, playerDefense, gameState.stats.hp, gameState.stats.maxHp,
    opponentAttack, opponentDefense, opponentHp, opponentHp,
    difficultyMult,
  );

  // 更新玩家气血
  gameState.stats.hp = log.playerHp;

  // 构建战斗描述
  const lines: string[] = [];
  lines.push(`⚔️ 【战斗】你 vs ${opponentName}`);

  for (const round of log.rounds) {
    const crit = round.isCritical ? ' 💥暴击!' : '';
    if (round.attacker === '你') {
      lines.push(`  你一招击出，造成 ${round.damage} 点伤害${crit}（${opponentName}剩余 ${round.remainingHp}）`);
    } else {
      lines.push(`  ${opponentName}反击，造成 ${round.damage} 点伤害${crit}（你剩余 ${round.remainingHp}）`);
    }
  }

  if (log.result === 'win') {
    lines.push(`🎉 你击败了${opponentName}！`);
  } else if (log.result === 'lose') {
    lines.push(`💀 你被${opponentName}击败了...`);
  } else {
    lines.push(`🏃 战斗陷入僵持，你趁机撤退了。`);
  }

  return lines.join('\n');
}

// ========== 探索资源识别 ==========

/** 境界等级（用于资源过滤） */
const REALM_LEVELS: Record<string, number> = {
  '凡兽': 0, '一阶妖兽': 1, '二阶妖兽': 2, '三阶妖兽': 3,
  '炼气期一层': 1, '炼气期二层': 2, '炼气期三层': 3, '炼气期四层': 4,
  '炼气期五层': 5, '炼气期六层': 6, '炼气期七层': 7, '炼气期八层': 8, '炼气期九层': 9,
  '筑基期': 10, '结丹期': 15, '元婴期': 20,
};

/** 资源所需最低境界 */
const RESOURCE_REALM_REQ: Record<string, string> = {
  '筑基丹': '炼气期九层',
  '结丹丸': '筑基期',
  '飞剑': '炼气期五层',
  '中品灵石': '炼气期三层',
  '上品灵石': '筑基期',
  '护身符': '炼气期二层',
};

/**
 * 检查玩家是否能识别/使用某物品
 * 返回 { canUse, reason }
 */
function _checkResourceAccess(itemName: string): { canUse: boolean; reason: string } {
  const req = RESOURCE_REALM_REQ[itemName];
  if (!req) return { canUse: true, reason: '' };

  const playerLevel = REALM_LEVELS[gameState.character.realm] ?? 0;
  const reqLevel = REALM_LEVELS[req] ?? 0;

  if (playerLevel < reqLevel) {
    return { canUse: false, reason: `你的境界不足以使用${itemName}（需要${req}）` };
  }
  return { canUse: true, reason: '' };
}

// ========== 选项弹窗逻辑 ==========

const choicesOverlay = document.getElementById('choices-overlay')!;
const choicesList = document.getElementById('choices-list')!;
const btnCloseChoices = document.getElementById('btn-close-choices')!;

/** 显示选项弹窗 */
function showChoices(choices: Array<{ index: number; text: string }>): void {
  choicesList.innerHTML = '';
  choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = `${choice.index}) ${choice.text}`;
    btn.addEventListener('click', () => {
      // 发送选项文本作为玩家行动
      chatInput.value = choice.text;
      hideChoices();
      sendMessage();
    });
    choicesList.appendChild(btn);
  });
  choicesOverlay.classList.remove('hidden');
}

/** 隐藏选项弹窗 */
function hideChoices(): void {
  choicesOverlay.classList.add('hidden');
}

btnCloseChoices.addEventListener('click', hideChoices);

// ========== 事件处理 ==========

async function sendMessage(): Promise<void> {
  const text = chatInput.value.trim();
  if (!text) return;

  // 隐藏选项弹窗
  hideChoices();

  // 死亡状态下禁止操作
  if (gameState.isDead) {
    addMessage('⚠️ 你已身殒道消，无法继续行动', 'system');
    return;
  }

  addMessage(text, 'player');
  chatInput.value = '';

  gameState.chatHistory.push({ role: 'user', content: text });

  try {
    // 动态注入当前玩家状态 + 场景信息（让 AI 了解完整上下文）
    const currentSceneData = gameState.scenes[gameState.currentScene];
    const sceneNpcs = Object.values(gameState.npcs)
      .filter((npc) => npc.location === gameState.currentScene && !gameState.defeatedNpcs.includes(npc.id))
      .map((npc) => `${npc.name}（${npc.realm},${npc.role === 'enemy' ? '敌人' : npc.role === 'merchant' ? '商人' : '剧情NPC'},好感:${npc.favorability}${npc.attackable ? ',可攻击' : ''}）`);

    const playerStatus = `【玩家状态】
境界:${gameState.character.realm} 气血:${gameState.stats.hp}/${gameState.stats.maxHp} 灵力:${gameState.stats.mp}/${gameState.stats.maxMp} 修为:${gameState.stats.exp}/${gameState.stats.maxExp}
位置:${gameState.character.location}
背包:${gameState.inventory.map((i) => `${i.name}×${i.count}`).join(', ') || '空'}
功法:${gameState.skills.map((s) => `${s.name}(${s.level})`).join(', ') || '无'}

【当前场景】${gameState.currentScene}
类型:${currentSceneData?.type ?? '未知'}
关联场景:${currentSceneData?.connectedScenes.join(', ') || '无'}
危险:${currentSceneData?.isDangerous ? '是' : '否'}
场景NPC:${sceneNpcs.join(', ') || '无'}

【已解锁场景】${Object.keys(gameState.scenes).join(', ')}`;

    // 构建带玩家状态的消息历史
    const enrichedHistory = [
      ...gameState.chatHistory,
      { role: 'system', content: playerStatus },
    ];

    const result = await window.gameAPI.sendMessage({
      message: text,
      history: enrichedHistory,
    });

    if (result.success) {
      // 解析资源变化标记
      const { cleanText, changes } = parseResourceChanges(result.reply);

      // 解析选项
      const choices = parseChoices(cleanText);
      let displayText = choices.length > 0 ? stripChoicesFromText(cleanText) : cleanText;

      // 解析快捷指令
      const quickActions = parseQuickActions(displayText);
      displayText = quickActions.length > 0 ? stripQuickActionsFromText(displayText) : displayText;

      // 显示纯文本
      addMessage(displayText, 'ai');
      gameState.chatHistory.push({ role: 'assistant', content: displayText });

      // 显示选项弹窗
      if (choices.length > 0) {
        showChoices(choices);
      }

      // 更新快捷指令按钮
      if (quickActions.length > 0) {
        renderQuickActions(quickActions);
      }

      // 应用资源变化并更新面板
      if (changes.length > 0) {
        const summary = applyResourceChanges(changes);
        updateResourcePanel();
        addMessage(summary, 'system');

        // 死亡判定：气血归零
        if (gameState.stats.hp <= 0 && !gameState.isDead) {
          gameState.isDead = true;
          updateResourcePanel();
          showDeathScreen();
        }
      }
    } else {
      addMessage(`⚠️ AI 错误：${result.error ?? '未知错误'}`, 'system');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addMessage(`⚠️ 通信错误：${errorMessage}`, 'system');
  }
}

async function saveGame(): Promise<void> {
  try {
    const result = await window.gameAPI.saveGame(gameState);
    if (result.success) {
      addMessage('💾 存档成功！', 'system');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addMessage(`⚠️ 存档失败：${errorMessage}`, 'system');
  }
}

async function loadGame(): Promise<void> {
  try {
    const result = await window.gameAPI.loadGame();
    if (result.success && result.data) {
      Object.assign(gameState, result.data);
      updateResourcePanel();
      addMessage('📂 读档成功！', 'system');
    } else {
      addMessage('📂 暂无存档数据', 'system');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addMessage(`⚠️ 读档失败：${errorMessage}`, 'system');
  }
}

// ========== 绑定事件 ==========

btnSend.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

btnSave.addEventListener('click', saveGame);
btnLoad.addEventListener('click', loadGame);

// ========== 设置面板逻辑 ==========

const settingsOverlay = document.getElementById('settings-overlay')!;
const btnSettings = document.getElementById('btn-settings')!;
const btnCloseSettings = document.getElementById('btn-close-settings')!;
const btnCancelSettings = document.getElementById('btn-cancel-settings')!;
const btnSaveSettings = document.getElementById('btn-save-settings')!;
const btnTestConnection = document.getElementById('btn-test-connection') as HTMLButtonElement;
const btnToggleKey = document.getElementById('btn-toggle-key') as HTMLButtonElement;

// 设置表单元素
const cfgType = document.getElementById('cfg-type') as HTMLSelectElement;
const cfgBaseURL = document.getElementById('cfg-baseurl') as HTMLInputElement;
const cfgApiKey = document.getElementById('cfg-apikey') as HTMLInputElement;
const cfgModel = document.getElementById('cfg-model') as HTMLInputElement;
const cfgMaxTokens = document.getElementById('cfg-maxtokens') as HTMLInputElement;
const cfgTemperature = document.getElementById('cfg-temperature') as HTMLInputElement;
const cfgSystemPrompt = document.getElementById('cfg-systemprompt') as HTMLTextAreaElement;

/** 打开设置面板并加载当前配置 */
async function openSettings(): Promise<void> {
  try {
    const result = await window.gameAPI.loadAIConfig();
    if (result.success && result.data) {
      const cfg = result.data as Record<string, unknown>;
      cfgType.value = (cfg.type as string) ?? 'openai';
      cfgBaseURL.value = (cfg.baseURL as string) ?? '';
      cfgApiKey.value = (cfg.apiKey as string) ?? '';
      cfgModel.value = (cfg.model as string) ?? '';
      cfgMaxTokens.value = String(cfg.maxTokens ?? 2048);
      cfgTemperature.value = String(cfg.temperature ?? 0.7);
      cfgSystemPrompt.value = (cfg.systemPrompt as string) ?? '';
    }
  } catch {
    // 首次使用，使用默认值
  }
  settingsOverlay.classList.remove('hidden');
  syncDifficultyToSettings();
}

/** 关闭设置面板 */
function closeSettings(): void {
  settingsOverlay.classList.add('hidden');
}

/** 从表单收集配置 */
function collectConfig(): Record<string, unknown> {
  return {
    type: cfgType.value,
    baseURL: cfgBaseURL.value.trim(),
    apiKey: cfgApiKey.value.trim(),
    model: cfgModel.value.trim(),
    maxTokens: Number(cfgMaxTokens.value) || 2048,
    temperature: Number(cfgTemperature.value) || 0.7,
    systemPrompt: cfgSystemPrompt.value.trim(),
  };
}

/** 保存配置 */
async function saveSettings(): Promise<void> {
  const config = collectConfig();
  try {
    const result = await window.gameAPI.saveAIConfig(config);
    if (result.success) {
      addMessage('⚙️ 模型配置已保存并生效', 'system');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addMessage(`⚠️ 保存配置失败：${errorMessage}`, 'system');
  }
  closeSettings();
  syncDifficultyFromSettings();
}

/** 测试连接 */
async function testConnection(): Promise<void> {
  const config = collectConfig();
  btnTestConnection.textContent = '⏳ 连接中...';
  btnTestConnection.disabled = true;
  try {
    const result = await window.gameAPI.testAIConnection(config);
    if (result.success) {
      btnTestConnection.textContent = '✅ 连接成功';
      btnTestConnection.classList.add('test-success');
    } else {
      btnTestConnection.textContent = `❌ ${result.error ?? '连接失败'}`;
      btnTestConnection.classList.add('test-fail');
    }
  } catch (err) {
    btnTestConnection.textContent = '❌ 连接失败';
    btnTestConnection.classList.add('test-fail');
  }
  // 2秒后恢复按钮
  setTimeout(() => {
    btnTestConnection.textContent = '🔌 测试连接';
    btnTestConnection.disabled = false;
    btnTestConnection.classList.remove('test-success', 'test-fail');
  }, 2000);
}

/** 切换密钥显示/隐藏 */
function toggleKeyVisibility(): void {
  const isPassword = cfgApiKey.type === 'password';
  cfgApiKey.type = isPassword ? 'text' : 'password';
  btnToggleKey.textContent = isPassword ? '🙈' : '👁️';
  btnToggleKey.classList.toggle('active', isPassword);
}

// 绑定设置面板事件
btnSettings.addEventListener('click', openSettings);
btnCloseSettings.addEventListener('click', closeSettings);
btnCancelSettings.addEventListener('click', closeSettings);
btnSaveSettings.addEventListener('click', saveSettings);
btnTestConnection.addEventListener('click', testConnection);
btnToggleKey.addEventListener('click', toggleKeyVisibility);

// 点击遮罩层关闭
settingsOverlay.addEventListener('click', (e: MouseEvent) => {
  if (e.target === settingsOverlay) {
    closeSettings();
  }
});

// ========== 死亡 & 突破动画 ==========

const deathOverlay = document.getElementById('death-overlay')!;
const deathMessage = document.getElementById('death-message')!;
const deathActions = document.getElementById('death-actions')!;
const breakthroughOverlay = document.getElementById('breakthrough-overlay')!;
const breakthroughRealm = document.getElementById('breakthrough-realm')!;
const difficultyBadge = document.getElementById('difficulty-badge')!;

/** 显示死亡画面 */
function showDeathScreen(): void {
  if (gameState.difficulty === 'hard') {
    deathMessage.textContent = '困难模式下，你的修仙之路到此为止...';
    deathActions.innerHTML = `
      <button id="btn-restart" class="btn-primary px-6 py-2.5 text-sm">🔄 重新开始</button>
    `;
    document.getElementById('btn-restart')!.addEventListener('click', resetGame);
  } else {
    // 简单模式：可消耗灵石复活
    const hasStone = gameState.inventory.some((i) => i.name === '下品灵石' && i.count >= 20);
    deathMessage.textContent = hasStone
      ? '消耗 20 下品灵石可复活继续修行'
      : '灵石不足，无法复活...';
    deathActions.innerHTML = `
      <button id="btn-revive" class="btn-primary px-6 py-2.5 text-sm" ${!hasStone ? 'disabled' : ''}>✨ 消耗灵石复活</button>
      <button id="btn-restart" class="btn-secondary px-6 py-2.5 text-sm">🔄 重新开始</button>
    `;
    const btnRevive = document.getElementById('btn-revive')!;
    if (btnRevive && hasStone) {
      btnRevive.addEventListener('click', revivePlayer);
    }
    document.getElementById('btn-restart')!.addEventListener('click', resetGame);
  }
  deathOverlay.classList.remove('hidden');
  // 简单模式：自动保存死亡存档
  saveDeathArchive();
}

/** 复活（简单模式） */
function revivePlayer(): void {
  // 扣除灵石
  const stone = gameState.inventory.find((i) => i.name === '下品灵石');
  if (stone) {
    stone.count -= 20;
    if (stone.count <= 0) {
      const idx = gameState.inventory.indexOf(stone);
      gameState.inventory.splice(idx, 1);
    }
  }
  // 恢复状态
  gameState.stats.hp = Math.floor(gameState.stats.maxHp * 0.5);
  gameState.stats.mp = Math.floor(gameState.stats.maxMp * 0.3);
  gameState.isDead = false;
  // 回到安全区域
  gameState.character.location = '七玄门外门居所';

  deathOverlay.classList.add('hidden');
  updateResourcePanel();
  addMessage('✨ 你消耗了 20 下品灵石，在七玄门弟子居所苏醒过来。气血恢复了一半。', 'system');
}

/** 重新开始游戏 */
function resetGame(): void {
  gameState.character = { name: '韩立', realm: '炼气期一层', sect: '七玄门', location: '外门居所' };
  gameState.stats = { hp: 100, maxHp: 100, mp: 80, maxMp: 100, exp: 10, maxExp: 100 };
  gameState.inventory = [
    { name: '黄龙丹', count: 3 },
    { name: '下品灵石', count: 50 },
    { name: '长剑', count: 1 },
  ];
  gameState.skills = [
    { name: '长春功', level: '入门' },
    { name: '基础剑术', level: '熟练' },
  ];
  gameState.chatHistory = [];
  gameState.isDead = false;
  gameState.currentScene = INITIAL_SCENE.name;
  gameState.scenes = { [INITIAL_SCENE.name]: INITIAL_SCENE };
  gameState.npcs = {};
  gameState.defeatedNpcs = [];

  // 清空对话区
  chatMessages.innerHTML = '';

  deathOverlay.classList.add('hidden');
  updateResourcePanel();

  // 重新显示欢迎消息
  addMessage(
    '欢迎来到修仙世界！你是一个出身贫寒的凡人，偶然间踏入修仙之门。<br><br>' +
    '当前你身处<strong>七玄门</strong>外门弟子居所，修为尚在<strong>炼气期一层</strong>。<br><br>' +
    '你可以选择与周围的人交谈、探索门派、修炼功法，或者外出历练。',
    'system',
  );
}

/** 显示境界突破动画 */
function showBreakthroughAnimation(newRealm: string): void {
  breakthroughRealm.textContent = newRealm;
  breakthroughOverlay.classList.remove('hidden');

  // 3秒后自动关闭
  setTimeout(() => {
    breakthroughOverlay.classList.add('hidden');
  }, 3000);
}

// ========== 难度系统 ==========

/** 更新难度徽章显示 */
function updateDifficultyBadge(): void {
  if (gameState.difficulty === 'hard') {
    difficultyBadge.textContent = '困难模式';
    difficultyBadge.className = 'px-2.5 py-1 text-[11px] rounded border border-destructive/50 text-destructive bg-destructive/10';
  } else {
    difficultyBadge.textContent = '简单模式';
    difficultyBadge.className = 'px-2.5 py-1 text-[11px] rounded border border-system-gold/50 text-system-gold bg-system-gold/10';
  }
}

/** 保存设置时同步难度 */
function syncDifficultyFromSettings(): void {
  const selected = document.querySelector('input[name="difficulty"]:checked') as HTMLInputElement;
  if (selected) {
    gameState.difficulty = selected.value as 'normal' | 'hard';
    updateDifficultyBadge();
  }
}

/** 打开设置时同步当前难度到表单 */
function syncDifficultyToSettings(): void {
  const radio = document.querySelector(`input[name="difficulty"][value="${gameState.difficulty}"]`) as HTMLInputElement;
  if (radio) {
    radio.checked = true;
  }
}

// ========== 快捷指令绑定 ==========
const quickActionsEl = document.getElementById('quick-actions')!;

/** 动态渲染快捷指令按钮 */
function renderQuickActions(actions: string[]): void {
  quickActionsEl.innerHTML = '';
  actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.dataset.action = action;
    btn.textContent = action;
    quickActionsEl.appendChild(btn);
  });
}

quickActionsEl.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const btn = target.closest('.quick-btn') as HTMLElement;
  if (!btn) return;
  const action = btn.dataset.action;
  if (action) {
    chatInput.value = action;
    sendMessage();
  }
});

// ========== 死亡存档（仅简单模式） ==========
async function saveDeathArchive(): Promise<void> {
  if (gameState.difficulty !== 'normal') return;
  try {
    await window.gameAPI.saveDeathArchive(gameState);
    console.log('死亡存档已保存');
  } catch (err) {
    console.error('保存死亡存档失败:', err);
  }
}

// ========== 背包弹窗 & 右键菜单 ==========

const inventoryOverlay = document.getElementById('inventory-overlay')!;
const inventoryBackdrop = document.getElementById('inventory-backdrop')!;
const inventoryFullList = document.getElementById('inventory-full-list')!;
const btnCloseInventory = document.getElementById('btn-close-inventory')!;
const inventoryPanel = document.getElementById('inventory-panel')!;
const contextMenu = document.getElementById('context-menu')!;
const contextMenuItems = document.getElementById('context-menu-items')!;

/** 打开完整背包弹窗 */
function openInventoryModal(): void {
  renderFullInventory();
  inventoryOverlay.classList.remove('hidden');
}

/** 关闭背包弹窗 */
function closeInventoryModal(): void {
  inventoryOverlay.classList.add('hidden');
}

/** 渲染完整背包列表 */
function renderFullInventory(): void {
  inventoryFullList.innerHTML = '';
  if (gameState.inventory.length === 0) {
    inventoryFullList.innerHTML = '<div class="col-span-2 text-center text-muted-foreground text-sm py-8">背包空空如也</div>';
    return;
  }
  gameState.inventory.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'inv-full-item';
    div.innerHTML = `
      <span class="item-icon">${getItemIcon(item.name)}</span>
      <span class="item-name">${item.name}</span>
      <span class="item-count">×${item.count}</span>
    `;
    // 右键菜单
    div.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, item, index);
    });
    inventoryFullList.appendChild(div);
  });
}

/** 显示右键菜单 */
function showContextMenu(x: number, y: number, item: InventoryItem, index: number): void {
  contextMenuItems.innerHTML = '';
  const desc = ITEM_DESCRIPTIONS[item.name] ?? '未知物品';

  // 描述（不可点击）
  const descItem = document.createElement('div');
  descItem.className = 'px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border';
  descItem.textContent = desc;
  contextMenuItems.appendChild(descItem);

  // 使用
  const useItem = document.createElement('div');
  useItem.className = 'ctx-item';
  useItem.textContent = '✋ 使用';
  useItem.addEventListener('click', () => {
    hideContextMenu();
    chatInput.value = `使用${item.name}`;
    hideChoices();
    sendMessage();
  });
  contextMenuItems.appendChild(useItem);

  // 丢弃
  const dropItem = document.createElement('div');
  dropItem.className = 'ctx-item danger';
  dropItem.textContent = '🗑️ 丢弃';
  dropItem.addEventListener('click', () => {
    hideContextMenu();
    gameState.inventory.splice(index, 1);
    updateResourcePanel();
    renderFullInventory();
    addMessage(`丢弃了 ${item.name}`, 'system');
  });
  contextMenuItems.appendChild(dropItem);

  // 定位
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove('hidden');
}

/** 隐藏右键菜单 */
function hideContextMenu(): void {
  contextMenu.classList.add('hidden');
}

// 绑定事件
inventoryPanel.addEventListener('click', openInventoryModal);
btnCloseInventory.addEventListener('click', closeInventoryModal);
inventoryBackdrop.addEventListener('click', closeInventoryModal);

// 点击其他区域关闭右键菜单
document.addEventListener('click', (e: MouseEvent) => {
  if (!contextMenu.contains(e.target as Node)) {
    hideContextMenu();
  }
});

// 初始化
document.querySelector('.message-time')!.textContent = getTimeStr();
updateResourcePanel();

console.log('凡人修仙传 RPG 渲染进程已加载');
