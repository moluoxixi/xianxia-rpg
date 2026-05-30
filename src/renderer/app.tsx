import { useMemo, useRef, useState } from 'react';
import {
  Archive,
  BookOpen,
  Boxes,
  ChevronRight,
  Heart,
  Loader2,
  Map,
  MessageSquare,
  Package,
  RotateCcw,
  Save,
  Send,
  Settings,
  Shield,
  Sparkles,
  Swords,
  User,
  Waves,
} from 'lucide-react';
import { INITIAL_SCENE, type NPC, type Scene } from '@shared/types/scene';
import { resolveCombat } from '@shared/types/combat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Role = 'user' | 'assistant' | 'system';
type Difficulty = 'normal' | 'hard';

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

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  time: string;
}

interface GameState {
  runId: string;
  character: CharacterInfo;
  stats: CharacterStats;
  inventory: InventoryItem[];
  skills: Skill[];
  chatHistory: Array<{ role: string; content: string }>;
  difficulty: Difficulty;
  isDead: boolean;
  currentScene: string;
  scenes: Record<string, Scene>;
  npcs: Record<string, NPC>;
  defeatedNpcs: string[];
}

interface ResourceChange {
  type:
    | 'item_add'
    | 'item_remove'
    | 'hp'
    | 'mp'
    | 'exp'
    | 'realm'
    | 'location'
    | 'skill_add'
    | 'skill_levelup'
    | 'combat'
    | 'scene_define'
    | 'npc_add'
    | 'npc_update'
    | 'favorability';
  name?: string;
  count?: number;
  value?: string | number;
  level?: string;
  opponent?: string;
  opponent_attack?: number;
  opponent_defense?: number;
  opponent_hp?: number;
  scene_name?: string;
  scene_type?: string;
  scene_region?: string;
  scene_description?: string;
  scene_connected?: string[];
  scene_resources?: string[];
  scene_dangerous?: boolean;
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
  target_npc?: string;
  favor_change?: number;
}

interface AIConfigForm {
  type: string;
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens: string;
  temperature: string;
  systemPrompt: string;
}

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'system',
  time: getTimeStr(),
  content:
    '欢迎来到修仙世界！你是一个出身贫寒的凡人，偶然间踏入修仙之门。\n\n当前你身处七玄门外门弟子居所，修为尚在炼气期一层。\n\n你可以选择与周围的人交谈、探索门派、修炼功法，或者外出历练。',
};

const pinnedItems = ['下品灵石', '黄龙丹', '长剑'];
const itemDescriptions: Record<string, string> = {
  黄龙丹: '恢复50点气血的初级丹药',
  回灵丹: '恢复30点灵力的丹药',
  筑基丹: '突破至筑基期所需的珍贵丹药',
  结丹丸: '结丹期修士修炼辅助丹药',
  下品灵石: '修仙界通用货币，可用于购买物品',
  中品灵石: '等价100下品灵石，高阶交易货币',
  上品灵石: '等价100中品灵石，极为珍贵',
  长剑: '普通铁剑，攻击力+5',
  飞剑: '法器级飞剑，可御剑飞行',
  护身符: '一次性防御道具，抵挡一次致命攻击',
  储物袋: '可存储物品的空间法器',
  灵草: '炼丹基础材料',
  铁精: '炼器基础材料',
  妖兽内丹: '妖兽体内的精华结晶，炼丹珍贵材料',
};
const itemIcons: Record<string, string> = {
  黄龙丹: '💊',
  回灵丹: '💊',
  筑基丹: '✨',
  结丹丸: '✨',
  下品灵石: '💎',
  中品灵石: '💎',
  上品灵石: '💎',
  长剑: '🗡️',
  飞剑: '⚔️',
  护身符: '🛡️',
  储物袋: '👜',
  灵草: '🌿',
  铁精: '⛏️',
  妖兽内丹: '🔮',
};
const realmLevels: Record<string, number> = {
  凡兽: 0,
  一阶妖兽: 1,
  二阶妖兽: 2,
  三阶妖兽: 3,
  炼气期一层: 1,
  炼气期二层: 2,
  炼气期三层: 3,
  炼气期四层: 4,
  炼气期五层: 5,
  炼气期六层: 6,
  炼气期七层: 7,
  炼气期八层: 8,
  炼气期九层: 9,
  筑基期: 10,
  结丹期: 15,
  元婴期: 20,
};
const resourceRealmReq: Record<string, string> = {
  筑基丹: '炼气期九层',
  结丹丸: '筑基期',
  飞剑: '炼气期五层',
  中品灵石: '炼气期三层',
  上品灵石: '筑基期',
  护身符: '炼气期二层',
};

function createRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getTimeStr(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function createInitialGameState(): GameState {
  return {
    runId: createRunId(),
    character: { name: '韩立', realm: '炼气期一层', sect: '七玄门', location: INITIAL_SCENE.name },
    stats: { hp: 100, maxHp: 100, mp: 80, maxMp: 100, exp: 10, maxExp: 100 },
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
}

function createMessage(role: Role, content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, time: getTimeStr() };
}

function getItemIcon(name: string): string {
  return itemIcons[name] ?? '📦';
}

function parseResourceChanges(aiReply: string): { cleanText: string; changes: ResourceChange[] } {
  const result = { cleanText: aiReply, changes: [] as ResourceChange[] };
  const match = aiReply.match(/\[资源变化\]\s*\n?([\s\S]*?)(?=\n\n|\n?\[快捷指令\]|\n*$)/);
  if (!match) return result;
  let jsonStr = match[1].trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.changes)) result.changes = parsed.changes;
  } catch {
    const jsonMatch = jsonStr.match(/\{[\s\S]*"changes"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.changes)) result.changes = parsed.changes;
      } catch {
        // 忽略格式不完整的 AI 标记
      }
    }
  }
  result.cleanText = aiReply.replace(/\[资源变化\]\s*\n?[\s\S]*?(?=\n\n|\n?\[快捷指令\]|\n*$)/, '').trim();
  return result;
}

function parseQuickActions(text: string): { cleanText: string; actions: string[] } {
  const match = text.match(/\[快捷指令\]\s*(\{[\s\S]*?\})/);
  if (!match) return { cleanText: text, actions: [] };
  try {
    const parsed = JSON.parse(match[1]);
    return {
      cleanText: text.replace(/\[快捷指令\]\s*\{[\s\S]*?\}/, '').trim(),
      actions: Array.isArray(parsed.actions) ? parsed.actions.filter((item: unknown) => typeof item === 'string') : [],
    };
  } catch {
    return { cleanText: text.replace(/\[快捷指令\]\s*\{[\s\S]*?\}/, '').trim(), actions: [] };
  }
}

function parseChoices(text: string): Array<{ index: number; text: string }> {
  const choices: Array<{ index: number; text: string }> = [];
  const regex = /^\s*(\d+)\s*[)）、.．]\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    choices.push({ index: Number(match[1]), text: match[2].trim() });
  }
  return choices;
}

function stripChoices(text: string): string {
  return text.replace(/^\s*\d+\s*[)）、.．]\s*.+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

function checkResourceAccess(gameState: GameState, itemName: string): { canUse: boolean; reason: string } {
  const req = resourceRealmReq[itemName];
  if (!req) return { canUse: true, reason: '' };
  const playerLevel = realmLevels[gameState.character.realm] ?? 0;
  const reqLevel = realmLevels[req] ?? 0;
  if (playerLevel < reqLevel) return { canUse: false, reason: `你的境界不足以使用${itemName}（需要${req}）` };
  return { canUse: true, reason: '' };
}

function cloneInitialState(): GameState {
  return createInitialGameState();
}

function normalizeLoadedGameState(data: unknown): GameState | null {
  if (!data || typeof data !== 'object') return null;
  const loaded = data as Partial<GameState>;
  const fallback = createInitialGameState();
  return {
    ...fallback,
    ...loaded,
    runId: loaded.runId ?? fallback.runId,
    character: { ...fallback.character, ...loaded.character },
    stats: { ...fallback.stats, ...loaded.stats },
    inventory: Array.isArray(loaded.inventory) ? loaded.inventory : fallback.inventory,
    skills: Array.isArray(loaded.skills) ? loaded.skills : fallback.skills,
    chatHistory: Array.isArray(loaded.chatHistory) ? loaded.chatHistory : fallback.chatHistory,
    scenes: loaded.scenes ?? fallback.scenes,
    npcs: loaded.npcs ?? fallback.npcs,
    defeatedNpcs: Array.isArray(loaded.defeatedNpcs) ? loaded.defeatedNpcs : fallback.defeatedNpcs,
  };
}

function buildPlayerStatus(gameState: GameState): string {
  const currentSceneData = gameState.scenes[gameState.currentScene];
  const sceneNpcs = Object.values(gameState.npcs)
    .filter((npc) => npc.location === gameState.currentScene && !gameState.defeatedNpcs.includes(npc.id))
    .map((npc) => `${npc.name}（${npc.realm},${npc.role === 'enemy' ? '敌人' : npc.role === 'merchant' ? '商人' : '剧情NPC'},好感:${npc.favorability}${npc.attackable ? ',可攻击' : ''}）`);

  return `【玩家状态】\n境界:${gameState.character.realm} 气血:${gameState.stats.hp}/${gameState.stats.maxHp} 灵力:${gameState.stats.mp}/${gameState.stats.maxMp} 修为:${gameState.stats.exp}/${gameState.stats.maxExp}\n位置:${gameState.character.location}\n背包:${gameState.inventory.map((i) => `${i.name}×${i.count}`).join(', ') || '空'}\n功法:${gameState.skills.map((s) => `${s.name}(${s.level})`).join(', ') || '无'}\n\n【当前场景】${gameState.currentScene}\n类型:${currentSceneData?.type ?? '未知'}\n关联场景:${currentSceneData?.connectedScenes.join(', ') || '无'}\n危险:${currentSceneData?.isDangerous ? '是' : '否'}\n场景NPC:${sceneNpcs.join(', ') || '无'}\n\n【已解锁场景】${Object.keys(gameState.scenes).join(', ')}`;
}

function executeCombatFromAI(state: GameState, opponentName: string, opponentAttack: number, opponentDefense: number, opponentHp: number) {
  const difficultyMult = state.difficulty === 'hard' ? 1.5 : 0.8;
  const playerAttack = 10 + state.stats.maxHp * 0.1;
  const playerDefense = 5 + state.stats.maxHp * 0.05;
  const log = resolveCombat(
    playerAttack,
    playerDefense,
    state.stats.hp,
    state.stats.maxHp,
    opponentAttack,
    opponentDefense,
    opponentHp,
    opponentHp,
    difficultyMult,
  );
  state.stats.hp = log.playerHp;
  const lines = [`⚔️ 【战斗】你 vs ${opponentName}`];
  for (const round of log.rounds) {
    const crit = round.isCritical ? ' 暴击!' : '';
    lines.push(
      round.attacker === '你'
        ? `你一招击出，造成 ${round.damage} 点伤害${crit}（${opponentName}剩余 ${round.remainingHp}）`
        : `${opponentName}反击，造成 ${round.damage} 点伤害${crit}（你剩余 ${round.remainingHp}）`,
    );
  }
  if (log.result === 'win') lines.push(`你击败了${opponentName}！`);
  if (log.result === 'lose') lines.push(`你被${opponentName}击败了...`);
  if (log.result === 'flee') lines.push('战斗陷入僵持，你趁机撤退了。');
  return lines.join('\n');
}

function applyResourceChanges(state: GameState, changes: ResourceChange[]): { nextState: GameState; summary: string; breakthroughRealm?: string } {
  const next = structuredClone(state);
  const summaries: string[] = [];
  let breakthroughRealm: string | undefined;

  for (const change of changes) {
    switch (change.type) {
      case 'item_add': {
        const name = change.name ?? '未知物品';
        const count = change.count ?? 1;
        const access = checkResourceAccess(next, name);
        summaries.push(access.canUse ? `📦 获得 ${name} ×${count}` : `⚠️ 获得 ${name} ×${count}，但${access.reason}`);
        const existing = next.inventory.find((item) => item.name === name);
        if (existing) existing.count += count;
        else next.inventory.push({ name, count });
        break;
      }
      case 'item_remove': {
        const name = change.name ?? '未知物品';
        const count = change.count ?? 1;
        const item = next.inventory.find((entry) => entry.name === name);
        if (item) item.count -= count;
        next.inventory = next.inventory.filter((entry) => entry.count > 0);
        summaries.push(`📦 失去 ${name} ×${count}`);
        break;
      }
      case 'hp':
        next.stats.hp = Math.max(0, Math.min(next.stats.maxHp, Number(change.value ?? 0)));
        summaries.push(`❤️ 气血 → ${next.stats.hp}`);
        break;
      case 'mp':
        next.stats.mp = Math.max(0, Math.min(next.stats.maxMp, Number(change.value ?? 0)));
        summaries.push(`💧 灵力 → ${next.stats.mp}`);
        break;
      case 'exp':
        next.stats.exp = Math.max(0, Math.min(next.stats.maxExp, Number(change.value ?? 0)));
        summaries.push(`✨ 修为 → ${next.stats.exp}/${next.stats.maxExp}`);
        break;
      case 'realm': {
        const newRealm = String(change.value ?? '');
        if (!newRealm) break;
        const oldRealm = next.character.realm;
        next.character.realm = newRealm;
        next.stats.maxHp += 20;
        next.stats.maxMp += 20;
        next.stats.hp = next.stats.maxHp;
        next.stats.mp = next.stats.maxMp;
        next.stats.exp = 0;
        breakthroughRealm = newRealm;
        summaries.push(`🎊 境界突破：${oldRealm} → ${newRealm}`);
        break;
      }
      case 'location': {
        const newLoc = String(change.value ?? '');
        if (!newLoc) break;
        next.character.location = newLoc;
        next.currentScene = newLoc;
        if (!next.scenes[newLoc]) {
          next.scenes[newLoc] = {
            name: newLoc,
            type: 'wild',
            region: next.character.sect,
            description: '',
            connectedScenes: [],
            npcs: [],
            availableResources: [],
            isDangerous: false,
          };
        }
        summaries.push(`📍 位置 → ${newLoc}`);
        break;
      }
      case 'skill_add': {
        const name = change.name ?? '未知功法';
        if (!next.skills.some((skill) => skill.name === name)) next.skills.push({ name, level: change.level ?? '入门' });
        summaries.push(`📖 学习功法：${name}（${change.level ?? '入门'}）`);
        break;
      }
      case 'skill_levelup': {
        const skill = next.skills.find((entry) => entry.name === change.name);
        if (skill && change.level) {
          const old = skill.level;
          skill.level = change.level;
          summaries.push(`📖 ${skill.name}：${old} → ${skill.level}`);
        }
        break;
      }
      case 'combat':
        summaries.push(executeCombatFromAI(next, change.opponent ?? '未知对手', change.opponent_attack ?? 10, change.opponent_defense ?? 5, change.opponent_hp ?? 30));
        break;
      case 'scene_define': {
        const sceneName = change.scene_name ?? '';
        if (!sceneName) break;
        next.scenes[sceneName] = {
          name: sceneName,
          type: (change.scene_type as Scene['type']) ?? 'wild',
          region: change.scene_region ?? '',
          description: change.scene_description ?? '',
          connectedScenes: change.scene_connected ?? [],
          npcs: next.scenes[sceneName]?.npcs ?? [],
          availableResources: change.scene_resources ?? [],
          isDangerous: change.scene_dangerous ?? false,
        };
        summaries.push(`🗺️ 发现新场景：${sceneName}`);
        break;
      }
      case 'npc_add': {
        const npcId = change.npc_id ?? `npc_${Date.now()}`;
        next.npcs[npcId] = {
          id: npcId,
          name: change.npc_name ?? '未知人物',
          role: (change.npc_role as NPC['role']) ?? 'story',
          location: change.npc_location ?? next.currentScene,
          realm: change.npc_realm ?? '凡人',
          sect: change.npc_sect,
          favorability: next.npcs[npcId]?.favorability ?? 0,
          attackable: change.npc_attackable ?? false,
          description: change.npc_description ?? '',
          combat: change.npc_attackable
            ? { attack: change.npc_attack ?? 10, defense: change.npc_defense ?? 5, hp: change.npc_maxhp ?? 50, maxHp: change.npc_maxhp ?? 50 }
            : undefined,
        };
        const scene = next.scenes[next.currentScene];
        if (scene && !scene.npcs.includes(npcId)) scene.npcs.push(npcId);
        summaries.push(`👤 遇到 ${next.npcs[npcId].name}`);
        break;
      }
      case 'npc_update': {
        const npc = change.npc_id ? next.npcs[change.npc_id] : undefined;
        if (npc) {
          if (change.npc_location) npc.location = change.npc_location;
          if (change.npc_description) npc.description = change.npc_description;
          summaries.push(`📝 ${npc.name} 信息更新`);
        }
        break;
      }
      case 'favorability': {
        const npc = change.target_npc ? next.npcs[change.target_npc] : undefined;
        if (npc) {
          const delta = change.favor_change ?? 0;
          npc.favorability = Math.max(-100, Math.min(100, npc.favorability + delta));
          summaries.push(`💬 ${npc.name} ${delta > 0 ? '好感度提升' : '好感度下降'} ${Math.abs(delta)}（当前：${npc.favorability}）`);
        }
        break;
      }
    }
  }
  return { nextState: next, summary: summaries.join('\n'), breakthroughRealm };
}

function statPercent(value: number, max: number): string {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

export function App() {
  const [gameState, setGameState] = useState<GameState>(() => cloneInitialState());
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [choices, setChoices] = useState<Array<{ index: number; text: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [breakthroughRealm, setBreakthroughRealm] = useState('');
  const [config, setConfig] = useState<AIConfigForm>({ type: 'openai', baseURL: '', apiKey: '', model: '', maxTokens: '2048', temperature: '0.7', systemPrompt: '' });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const sceneNpcs = useMemo(
    () => Object.values(gameState.npcs).filter((npc) => npc.location === gameState.currentScene && !gameState.defeatedNpcs.includes(npc.id)),
    [gameState.currentScene, gameState.defeatedNpcs, gameState.npcs],
  );

  function pushMessage(role: Role, content: string) {
    setMessages((current) => [...current, createMessage(role, content)]);
    requestAnimationFrame(() => {
      if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    });
  }

  async function sendAction(action?: string) {
    const text = (action ?? input).trim();
    if (!text || isSending) return;
    if (gameState.isDead) {
      pushMessage('system', '你已身殒道消，无法继续行动。');
      return;
    }

    setInput('');
    setChoices([]);
    setIsSending(true);
    pushMessage('user', text);

    const history = [...gameState.chatHistory, { role: 'user', content: text }, { role: 'system', content: buildPlayerStatus(gameState) }];

    try {
      const result = await window.gameAPI.sendMessage({ message: text, history });
      if (!result.success) {
        pushMessage('system', `AI 错误：${result.error ?? '未知错误'}`);
        return;
      }

      const { cleanText, changes } = parseResourceChanges(result.reply);
      const nextChoices = parseChoices(cleanText);
      const withoutChoices = nextChoices.length > 0 ? stripChoices(cleanText) : cleanText;
      const quick = parseQuickActions(withoutChoices);
      const displayText = quick.cleanText || withoutChoices;

      pushMessage('assistant', displayText);
      setChoices(nextChoices);
      if (quick.actions.length > 0) setQuickActions(quick.actions);

      let nextState = structuredClone(gameState);
      nextState.chatHistory = [...gameState.chatHistory, { role: 'user', content: text }, { role: 'assistant', content: displayText }];
      if (changes.length > 0) {
        const applied = applyResourceChanges(nextState, changes);
        nextState = applied.nextState;
        if (applied.summary) pushMessage('system', applied.summary);
        if (applied.breakthroughRealm) {
          setBreakthroughRealm(applied.breakthroughRealm);
          setTimeout(() => setBreakthroughRealm(''), 2600);
        }
      }
      if (nextState.stats.hp <= 0) {
        nextState.isDead = true;
        window.gameAPI.saveDeathArchive(nextState).catch(() => undefined);
      }
      window.gameAPI.saveGame(nextState).catch(() => undefined);
      setGameState(nextState);
    } catch (error) {
      pushMessage('system', `通信错误：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSending(false);
    }
  }

  async function openSettings() {
    const result = await window.gameAPI.loadAIConfig();
    if (result.success && result.data && typeof result.data === 'object') {
      const loaded = result.data as Record<string, unknown>;
      setConfig({
        type: String(loaded.type ?? 'openai'),
        baseURL: String(loaded.baseURL ?? ''),
        apiKey: String(loaded.apiKey ?? ''),
        model: String(loaded.model ?? ''),
        maxTokens: String(loaded.maxTokens ?? 2048),
        temperature: String(loaded.temperature ?? 0.7),
        systemPrompt: String(loaded.systemPrompt ?? ''),
      });
    }
    setSettingsOpen(true);
  }

  async function saveSettings() {
    await window.gameAPI.saveAIConfig({ ...config, maxTokens: Number(config.maxTokens), temperature: Number(config.temperature) });
    pushMessage('system', '模型配置已保存并生效。');
    setSettingsOpen(false);
  }

  async function saveGame() {
    const result = await window.gameAPI.saveGame(gameState);
    if (result.success && result.data) setGameState(normalizeLoadedGameState(result.data) ?? gameState);
    pushMessage('system', result.success ? '存档成功。' : `存档失败：${result.message}`);
  }

  async function loadGame() {
    const result = await window.gameAPI.loadGame();
    const loadedState = normalizeLoadedGameState(result.data);
    if (result.success && loadedState) {
      setGameState(loadedState);
      pushMessage('system', '读档成功。');
    } else {
      pushMessage('system', '暂无存档数据。');
    }
  }

  function resetGame() {
    const nextState = cloneInitialState();
    setGameState(nextState);
    setMessages([createMessage('system', welcomeMessage.content)]);
    setQuickActions([]);
    setChoices([]);
    window.gameAPI.saveGame(nextState).catch(() => undefined);
  }

  function revivePlayer() {
    setGameState((current) => {
      const next = structuredClone(current);
      const stone = next.inventory.find((item) => item.name === '下品灵石');
      if (stone) stone.count -= 20;
      next.inventory = next.inventory.filter((item) => item.count > 0);
      next.stats.hp = Math.floor(next.stats.maxHp * 0.5);
      next.stats.mp = Math.floor(next.stats.maxMp * 0.3);
      next.isDead = false;
      next.character.location = INITIAL_SCENE.name;
      next.currentScene = INITIAL_SCENE.name;
      return next;
    });
    pushMessage('system', '你消耗了 20 下品灵石，在七玄门弟子居所苏醒过来。');
  }

  function dropItem(index: number) {
    setGameState((current) => {
      const next = structuredClone(current);
      next.inventory.splice(index, 1);
      return next;
    });
  }

  const hasReviveStone = gameState.inventory.some((item) => item.name === '下品灵石' && item.count >= 20);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="app-region-drag flex items-center justify-between border-b-2 border-primary bg-[#13233d] px-5 py-2.5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-[4px] text-primary">凡人修仙传</h1>
          <span className="border-l border-border pl-3 text-xs text-muted-foreground">AI修仙文字冒险</span>
        </div>
        <div className="app-region-no-drag flex items-center gap-2">
          <span className={cn('rounded border px-2.5 py-1 text-[11px]', gameState.difficulty === 'hard' ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-system-gold/50 bg-system-gold/10 text-system-gold')}>
            {gameState.difficulty === 'hard' ? '困难模式' : '简单模式'}
          </span>
          <Button variant="outline" size="sm" onClick={openSettings}><Settings className="h-4 w-4" />设置</Button>
          <Button variant="outline" size="sm" onClick={saveGame}><Save className="h-4 w-4" />存档</Button>
          <Button variant="outline" size="sm" onClick={loadGame}><Archive className="h-4 w-4" />读档</Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col border-r border-border">
          <div ref={viewportRef} className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          </div>

          {choices.length > 0 && (
            <div className="border-t border-border bg-muted/40 p-3">
              <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {choices.map((choice) => (
                  <Button key={`${choice.index}-${choice.text}`} variant="secondary" className="justify-start" onClick={() => sendAction(choice.text)}>
                    {choice.index}. {choice.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1.5 overflow-x-auto border-t border-border bg-[#12122a] px-3 py-2">
            {quickActions.length === 0 ? <span className="text-xs text-muted-foreground">等待 AI 生成当前场景快捷指令...</span> : quickActions.map((action) => (
              <button key={action} className="quick-btn" onClick={() => sendAction(action)}>{action}</button>
            ))}
          </div>

          <div className="flex gap-2 border-t border-border bg-card p-3">
            <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendAction(); } }} placeholder="输入你的行动..." className="max-h-32 min-h-[48px] resize-none" />
            <Button className="h-auto px-5" onClick={() => sendAction()} disabled={isSending}>{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}发送</Button>
          </div>
        </section>

        <aside className="w-[320px] shrink-0 overflow-y-auto bg-[#14142e] p-4">
          <Card className="mb-4 p-3">
            <PanelTitle icon={<User className="h-4 w-4" />} title="角色状态" />
            <InfoRow label="姓名" value={gameState.character.name} />
            <InfoRow label="境界" value={gameState.character.realm} highlight />
            <InfoRow label="门派" value={gameState.character.sect} />
            <InfoRow label="位置" value={gameState.character.location} />
          </Card>

          <Card className="mb-4 p-3">
            <PanelTitle icon={<Shield className="h-4 w-4" />} title="属性" />
            <StatBar icon={<Heart className="h-3.5 w-3.5" />} label="气血" value={gameState.stats.hp} max={gameState.stats.maxHp} className="from-hp-gradient-from to-hp-gradient-to" />
            <StatBar icon={<Waves className="h-3.5 w-3.5" />} label="灵力" value={gameState.stats.mp} max={gameState.stats.maxMp} className="from-mp-gradient-from to-mp-gradient-to" />
            <StatBar icon={<Sparkles className="h-3.5 w-3.5" />} label="修为" value={gameState.stats.exp} max={gameState.stats.maxExp} className="from-exp-gradient-from to-exp-gradient-to" />
          </Card>

          <Card className="mb-4 p-3">
            <PanelTitle icon={<Map className="h-4 w-4" />} title="当前场景" />
            <p className="text-sm text-foreground">{gameState.currentScene}</p>
            <p className="mt-1 text-xs text-muted-foreground">{gameState.scenes[gameState.currentScene]?.description || '场景信息由 AI 动态补全'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(gameState.scenes[gameState.currentScene]?.connectedScenes ?? []).map((scene) => <span key={scene} className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground">{scene}</span>)}
            </div>
          </Card>

          <Card className="mb-4 cursor-pointer p-3 transition-colors hover:border-primary/50" onClick={() => setInventoryOpen(true)}>
            <PanelTitle icon={<Package className="h-4 w-4" />} title="背包" action="点击查看全部" />
            <div className="grid grid-cols-2 gap-1.5">
              {pinnedItems.map((name) => {
                const item = gameState.inventory.find((entry) => entry.name === name);
                return <div key={name} title={itemDescriptions[name]} className="rounded bg-secondary px-2 py-1.5 text-center text-xs text-foreground/80">{getItemIcon(name)} {name}{item ? ` ×${item.count}` : ''}</div>;
              })}
            </div>
          </Card>

          <Card className="mb-4 p-3">
            <PanelTitle icon={<BookOpen className="h-4 w-4" />} title="功法" />
            <div className="flex flex-col gap-1.5">
              {gameState.skills.map((skill) => <div key={skill.name} className="rounded bg-secondary px-2 py-1.5 text-xs text-foreground/80">{skill.name}（{skill.level}）</div>)}
            </div>
          </Card>

          <Card className="p-3">
            <PanelTitle icon={<MessageSquare className="h-4 w-4" />} title="场景 NPC" />
            {sceneNpcs.length === 0 ? <p className="text-xs text-muted-foreground">当前暂无已记录 NPC</p> : sceneNpcs.map((npc) => <NpcRow key={npc.id} npc={npc} />)}
          </Card>
        </aside>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>模型与游戏设置</DialogTitle></DialogHeader>
          <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="类型"><Input value={config.type} onChange={(event) => setConfig({ ...config, type: event.target.value })} /></Field>
              <Field label="模型"><Input value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })} /></Field>
              <Field label="Base URL"><Input value={config.baseURL} onChange={(event) => setConfig({ ...config, baseURL: event.target.value })} /></Field>
              <Field label="API Key"><Input type="password" value={config.apiKey} onChange={(event) => setConfig({ ...config, apiKey: event.target.value })} /></Field>
              <Field label="Max Tokens"><Input value={config.maxTokens} onChange={(event) => setConfig({ ...config, maxTokens: event.target.value })} /></Field>
              <Field label="Temperature"><Input value={config.temperature} onChange={(event) => setConfig({ ...config, temperature: event.target.value })} /></Field>
            </div>
            <Field label="系统提示词"><Textarea className="min-h-[220px]" value={config.systemPrompt} onChange={(event) => setConfig({ ...config, systemPrompt: event.target.value })} /></Field>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm text-muted-foreground">难度模式</span>
              <div className="flex gap-2">
                <Button variant={gameState.difficulty === 'normal' ? 'default' : 'outline'} size="sm" onClick={() => setGameState((current) => ({ ...current, difficulty: 'normal' }))}>简单</Button>
                <Button variant={gameState.difficulty === 'hard' ? 'destructive' : 'outline'} size="sm" onClick={() => setGameState((current) => ({ ...current, difficulty: 'hard' }))}>困难</Button>
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setSettingsOpen(false)}>取消</Button><Button onClick={saveSettings}>保存</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <DialogContent className="w-[min(92vw,560px)]">
          <DialogHeader><DialogTitle>背包</DialogTitle></DialogHeader>
          <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-5">
            {gameState.inventory.length === 0 ? <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">背包空空如也</div> : gameState.inventory.map((item, index) => (
              <Card key={`${item.name}-${index}`} className="p-3">
                <div className="text-2xl">{getItemIcon(item.name)}</div>
                <div className="mt-1 text-sm font-semibold">{item.name}</div>
                <div className="text-xs text-muted-foreground">×{item.count}</div>
                <p className="mt-2 min-h-8 text-xs text-muted-foreground">{itemDescriptions[item.name] ?? '未知物品'}</p>
                <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={() => sendAction(`使用${item.name}`)}>使用</Button><Button size="sm" variant="destructive" onClick={() => dropItem(index)}>丢弃</Button></div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {gameState.isDead && <DeathOverlay hard={gameState.difficulty === 'hard'} canRevive={hasReviveStone} onRevive={revivePlayer} onRestart={resetGame} />}
      {breakthroughRealm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70"><div className="realm-glow text-center text-5xl font-bold tracking-[8px] text-primary">突破<br /><span className="mt-4 block text-3xl">{breakthroughRealm}</span></div></div>}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const meta = message.role === 'user' ? { name: '韩立', icon: <User className="h-5 w-5" />, color: 'text-foreground', align: 'justify-end' } : message.role === 'system' ? { name: '天道', icon: <ScrollIcon />, color: 'text-system-gold', align: 'justify-start' } : { name: 'AI', icon: <Sparkles className="h-5 w-5" />, color: 'text-ai-blue', align: 'justify-start' };
  return (
    <div className={cn('mb-4 flex gap-3 animate-fade-in', meta.align)}>
      {message.role !== 'user' && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-lg">{meta.icon}</div>}
      <div className={cn('max-w-[74%] rounded-xl border px-4 py-3', message.role === 'user' ? 'border-player-blue bg-player-blue' : message.role === 'system' ? 'border-system-gold/30 bg-card' : 'border-ai-blue/30 bg-card')}>
        <div className="mb-1 flex items-center gap-2"><span className={cn('text-xs font-bold', meta.color)}>{meta.name}</span><span className="text-[11px] text-muted-foreground">{message.time}</span></div>
        <div className="message-text whitespace-pre-wrap text-sm leading-7 text-foreground/90">{message.content}</div>
      </div>
      {message.role === 'user' && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-lg">{meta.icon}</div>}
    </div>
  );
}

function ScrollIcon() {
  return <span className="text-lg">📜</span>;
}

function PanelTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: string }) {
  return <div className="mb-2.5 flex items-center justify-between border-b border-border pb-1.5 text-sm font-semibold text-primary"><span className="flex items-center gap-2">{icon}{title}</span>{action && <span className="text-[10px] font-normal text-muted-foreground">{action}</span>}</div>;
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className={highlight ? 'text-primary' : 'text-foreground'}>{value}</span></div>;
}

function StatBar({ icon, label, value, max, className }: { icon: React.ReactNode; label: string; value: number; max: number; className: string }) {
  return <div className="mb-3"><div className="mb-1 flex justify-between text-xs"><span className="flex items-center gap-1 text-muted-foreground">{icon}{label}</span><span>{value}/{max}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full bg-gradient-to-r transition-all', className)} style={{ width: statPercent(value, max) }} /></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}

function NpcRow({ npc }: { npc: NPC }) {
  return <div className="mb-2 rounded-md border border-border bg-secondary/60 p-2 text-xs"><div className="flex items-center justify-between text-foreground"><span>{npc.name}</span><span className="text-muted-foreground">好感 {npc.favorability}</span></div><div className="mt-1 flex items-center gap-1 text-muted-foreground"><ChevronRight className="h-3 w-3" />{npc.realm} / {npc.role}</div></div>;
}

function DeathOverlay({ hard, canRevive, onRevive, onRestart }: { hard: boolean; canRevive: boolean; onRevive: () => void; onRestart: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80"><Card className="w-[min(92vw,460px)] p-8 text-center"><Swords className="mx-auto mb-4 h-12 w-12 text-destructive" /><h2 className="mb-3 text-2xl font-bold text-destructive">身殒道消</h2><p className="mb-6 text-sm text-muted-foreground">{hard ? '困难模式下，你的修仙之路到此为止。' : canRevive ? '消耗 20 下品灵石可复活继续修行。' : '灵石不足，无法复活。'}</p><div className="flex justify-center gap-3">{!hard && <Button disabled={!canRevive} onClick={onRevive}><Sparkles className="h-4 w-4" />复活</Button>}<Button variant="secondary" onClick={onRestart}><RotateCcw className="h-4 w-4" />重新开始</Button></div></Card></div>;
}
