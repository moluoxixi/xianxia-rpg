import { useMemo, useRef, useState } from 'react';
import type { NPC } from '@shared/types/scene';
import { INITIAL_SCENE } from '@shared/types/scene';
import { AppHeader, BreakthroughOverlay, ChatPanel, DeathOverlay, InventoryDialog, SettingsDialog, StatusSidebar } from '@/components/game';
import { applyResourceChanges, buildPlayerStatus, cloneInitialState, createMessage, getDefaultQuickActions, normalizeLoadedGameState, parseChoices, parseQuickActions, parseResourceChanges, stripChoices } from '@/domain';
import type { AIConfigForm, AppliedEvent, ChatMessage, Choice, Difficulty, GameState, Role } from '@/domain';

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'system',
  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  content: '欢迎来到修仙世界！你是一个出身贫寒的凡人，偶然间踏入修仙之门。\n\n当前你身处七玄门外门弟子居所，修为尚在炼气期一层。\n\n你可以选择与周围的人交谈、探索门派、修炼功法，或者外出历练。',
};

const defaultConfig: AIConfigForm = {
  type: 'openai',
  baseURL: '',
  apiKey: '',
  model: '',
  maxTokens: '2048',
  temperature: '0.7',
  systemPrompt: '',
};

export function App() {
  const initialGameState = useMemo(() => cloneInitialState(), []);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [quickActions, setQuickActions] = useState<string[]>(() => getDefaultQuickActions(initialGameState));
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [breakthroughRealm, setBreakthroughRealm] = useState('');
  const [config, setConfig] = useState<AIConfigForm>(defaultConfig);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const sceneNpcs = useMemo<NPC[]>(
    () => Object.values(gameState.npcs).filter((npc) => npc.location === gameState.currentScene && !gameState.defeatedNpcs.includes(npc.id)),
    [gameState.currentScene, gameState.defeatedNpcs, gameState.npcs],
  );

  function pushMessage(role: Role, content: string) {
    setMessages((current) => [...current, createMessage(role, content)]);
    requestAnimationFrame(() => {
      if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    });
  }

  async function persistGame(nextState: GameState, events: AppliedEvent[] = []) {
    await window.gameAPI.saveGame({ ...nextState, pendingEvents: events }).catch(() => undefined);
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

      const baseState = structuredClone(gameState);
      baseState.chatHistory = [...gameState.chatHistory, { role: 'user', content: text }, { role: 'assistant', content: displayText }];
      const applied = changes.length > 0 ? applyResourceChanges(baseState, changes) : { nextState: baseState, summary: '', events: [] };
      const nextState = applied.nextState;

      setQuickActions(quick.actions.length > 0 ? quick.actions : getDefaultQuickActions(nextState));

      if (applied.summary) pushMessage('system', applied.summary);
      if (applied.breakthroughRealm) {
        setBreakthroughRealm(applied.breakthroughRealm);
        setTimeout(() => setBreakthroughRealm(''), 2600);
      }
      if (nextState.stats.hp <= 0) {
        nextState.isDead = true;
        window.gameAPI.saveDeathArchive(nextState).catch(() => undefined);
      }

      setGameState(nextState);
      await persistGame(nextState, applied.events);
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
      setQuickActions(getDefaultQuickActions(loadedState));
      pushMessage('system', '读档成功。');
    } else {
      pushMessage('system', '暂无存档数据。');
    }
  }

  function resetGame() {
    const nextState = cloneInitialState();
    setGameState(nextState);
    setMessages([createMessage('system', welcomeMessage.content)]);
    setQuickActions(getDefaultQuickActions(nextState));
    setChoices([]);
    persistGame(nextState);
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
      persistGame(next);
      return next;
    });
    pushMessage('system', '你消耗了 20 下品灵石，在七玄门弟子居所苏醒过来。');
  }

  function dropItem(index: number) {
    setGameState((current) => {
      const next = structuredClone(current);
      next.inventory.splice(index, 1);
      persistGame(next);
      return next;
    });
  }

  function changeDifficulty(difficulty: Difficulty) {
    setGameState((current) => {
      const next = { ...current, difficulty };
      persistGame(next);
      return next;
    });
  }

  const hasReviveStone = gameState.inventory.some((item) => item.name === '下品灵石' && item.count >= 20);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader difficulty={gameState.difficulty} onOpenSettings={openSettings} onSave={saveGame} onLoad={loadGame} />
      <main className="flex min-h-0 flex-1">
        <ChatPanel messages={messages} viewportRef={viewportRef} choices={choices} quickActions={quickActions} input={input} isSending={isSending} onInputChange={setInput} onSend={sendAction} />
        <StatusSidebar gameState={gameState} sceneNpcs={sceneNpcs} onOpenInventory={() => setInventoryOpen(true)} />
      </main>
      <SettingsDialog open={settingsOpen} config={config} difficulty={gameState.difficulty} onOpenChange={setSettingsOpen} onConfigChange={setConfig} onDifficultyChange={changeDifficulty} onSave={saveSettings} />
      <InventoryDialog open={inventoryOpen} items={gameState.inventory} onOpenChange={setInventoryOpen} onUseItem={(name) => sendAction(`使用${name}`)} onDropItem={dropItem} />
      {gameState.isDead ? <DeathOverlay hard={gameState.difficulty === 'hard'} canRevive={hasReviveStone} onRevive={revivePlayer} onRestart={resetGame} /> : null}
      <BreakthroughOverlay realm={breakthroughRealm} />
    </div>
  );
}
