import type { GameHostClient, GameSaveSummary, NovelSummary, NPC } from '@xianxia-rpg/core';
import type { AIModelCatalog } from '@xianxia-rpg/model';
import type { GameSessionController } from './types';
import type { AIConfigForm, AppliedEvent, ApplyResourceResult, ChatMessage, Choice, Difficulty, GameState, GameThemeId, GameThemeSource, GameTypeId, InventoryItem, Role, ScenarioGenerationSeed } from '@/domain';
import { createDefaultModelCatalog, createDefaultModelSettings } from '@xianxia-rpg/model';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyResourceChanges,
  availableNovelScenarios,
  buildPlayerStatus,
  cloneScenarioInitialState,
  cloneInitialState,
  createMessage,
  createRecommendedNovelSummaries,
  createScenarioFromNovelTitle,
  defaultNovelApiBaseURL,
  defaultNovelApiBuildRequestCode,
  defaultNovelApiKey,
  defaultNovelApiMapResponseCode,
  defaultNovelApiProvider,
  getDefaultQuickActions,
  getInventoryItemKey,
  inferThemeIdFromNovel,
  inferGameTypeFromNovel,
  mergeNovelSummaries,
  mergeQuickActions,
  normalizeNovelApiProvider,
  normalizeLoadedGameState,
  pinnedItems,
  parseChoices,
  parseQuickActions,
  parseResourceChanges,
  removeRemoteChangesCoveredByLocal,
  resolveLocalAction,
  stripChoices,
  syncAttributesFromStats,
} from '@/domain';
import { getGameHostClient } from '@/host';

const defaultModelSettings = createDefaultModelSettings('openai');
const defaultProviderBaseURLs = {
  openai: createDefaultModelSettings('openai').baseURL,
  anthropic: createDefaultModelSettings('anthropic').baseURL,
};
const reviveTokenItemName = '复苏凭证';

const defaultConfig: AIConfigForm = {
  type: defaultModelSettings.type,
  baseURL: defaultModelSettings.baseURL,
  apiKey: '',
  providerApiKeys: {
    openai: '',
    anthropic: '',
  },
  providerBaseURLs: defaultProviderBaseURLs,
  model: defaultModelSettings.model,
  modelCatalog: defaultModelSettings.modelCatalog,
  maxTokens: String(defaultModelSettings.maxTokens),
  temperature: String(defaultModelSettings.temperature),
  systemPrompt: '',
  novelApiProvider: defaultNovelApiProvider,
  novelApiBaseURL: defaultNovelApiBaseURL,
  novelApiKey: defaultNovelApiKey,
  novelApiBuildRequestCode: defaultNovelApiBuildRequestCode,
  novelApiMapResponseCode: defaultNovelApiMapResponseCode,
};

function findLastAssistantMessage(messages: ChatMessage[]): ChatMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'assistant')
      return messages[index];
  }
  return undefined;
}

function normalizeNovelStartInput(novelInput: NovelSummary | string): { title: string; author?: string; description?: string } {
  if (typeof novelInput === 'string')
    return { title: novelInput };
  return { title: novelInput.title, author: novelInput.author, description: novelInput.description };
}

function createOpeningMessage(gameState: GameState): ChatMessage {
  return createMessage('system', gameState.scenario.openingMessage);
}

function createLoadedMessages(gameState: GameState, successMessage: string): ChatMessage[] {
  return [
    createOpeningMessage(gameState),
    ...gameState.chatHistory.map(message => createMessage(message.role as Role, message.content)),
    createMessage('system', successMessage),
  ];
}

export function useGameSession(client?: GameHostClient): GameSessionController {
  const hostClient = useMemo(() => client ?? getGameHostClient(), [client]);
  const initialGameState = useMemo(() => cloneInitialState(), []);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createOpeningMessage(initialGameState)]);
  const [input, setInput] = useState('');
  const [quickActions, setQuickActions] = useState<string[]>(() => getDefaultQuickActions(initialGameState));
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [gameSaves, setGameSaves] = useState<GameSaveSummary[]>([]);
  const [novels, setNovels] = useState<NovelSummary[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isSearchingNovels, setIsSearchingNovels] = useState(false);
  const [saveListMessage, setSaveListMessage] = useState('');
  const [novelSearchMessage, setNovelSearchMessage] = useState('');
  const [newGameMessage, setNewGameMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [selectedInventoryKey, setSelectedInventoryKey] = useState<string | null>(null);
  const [pinnedInventoryKeys, setPinnedInventoryKeys] = useState<string[]>(pinnedItems);
  const [breakthroughRealm, setBreakthroughRealm] = useState('');
  const [config, setConfig] = useState<AIConfigForm>(defaultConfig);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const novelSearchRequestIdRef = useRef(0);

  const sceneNpcs = useMemo<NPC[]>(
    () => Object.values(gameState.npcs).filter(npc => npc.location === gameState.currentScene && !gameState.defeatedNpcs.includes(npc.id)),
    [gameState.currentScene, gameState.defeatedNpcs, gameState.npcs],
  );

  const recoveredQuickActions = useMemo(() => {
    const lastAssistantMessage = findLastAssistantMessage(messages);
    if (!lastAssistantMessage)
      return [];

    return parseQuickActions(lastAssistantMessage.content).actions;
  }, [messages]);
  const displayedQuickActions = recoveredQuickActions.length > 0 ? mergeQuickActions(gameState, recoveredQuickActions) : quickActions;

  const refreshGameSaves = useCallback(async (): Promise<void> => {
    setIsLoadingSaves(true);
    setSaveListMessage('');
    try {
      const result = await hostClient.listGameSaves();
      if (result.success) {
        setGameSaves(result.data);
        return;
      }
      setGameSaves([]);
      setSaveListMessage(result.message ?? '存档列表读取失败');
    }
    finally {
      setIsLoadingSaves(false);
    }
  }, [hostClient]);

  useEffect(() => {
    void refreshGameSaves();
  }, [refreshGameSaves]);

  const searchNovels = useCallback(async (keyword: string): Promise<void> => {
    const requestId = novelSearchRequestIdRef.current + 1;
    novelSearchRequestIdRef.current = requestId;
    setIsSearchingNovels(true);
    setNovelSearchMessage('');
    try {
      const result = await hostClient.searchNovels(keyword);
      if (requestId !== novelSearchRequestIdRef.current)
        return;

      if (result.success) {
        setNovels(mergeNovelSummaries(createRecommendedNovelSummaries(), result.data));
        setNovelSearchMessage(result.message ?? '');
        return;
      }
      setNovels([]);
      setNovelSearchMessage(result.message ?? '小说搜索失败');
    }
    finally {
      if (requestId === novelSearchRequestIdRef.current)
        setIsSearchingNovels(false);
    }
  }, [hostClient]);

  function pushMessage(role: Role, content: string): void {
    setMessages(current => [...current, createMessage(role, content)]);
    requestAnimationFrame(() => {
      if (viewportRef.current)
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    });
  }

  function reportAsyncError(scope: string, error: unknown): void {
    pushMessage('system', `${scope}失败：${error instanceof Error ? error.message : String(error)}`);
  }

  function clearCurrentGameSession(message?: string): void {
    const nextInitialGameState = cloneInitialState();
    setGameState(nextInitialGameState);
    const openingMessage = createOpeningMessage(nextInitialGameState);
    setMessages(message ? [openingMessage, createMessage('system', message)] : [openingMessage]);
    setInput('');
    setQuickActions(getDefaultQuickActions(nextInitialGameState));
    setChoices([]);
    setPinnedInventoryKeys([...pinnedItems]);
    setSelectedInventoryKey(null);
    setInventoryOpen(false);
    setBreakthroughRealm('');
  }

  async function persistInventoryPins(runId: string, nextPinnedKeys: string[]): Promise<void> {
    const result = await hostClient.saveInventoryPins({ runId, pinnedKeys: nextPinnedKeys });
    if (!result.success)
      pushMessage('system', `背包置顶保存失败：${result.message}`);
  }

  async function loadPinnedInventoryKeys(runId: string): Promise<string[]> {
    const result = await hostClient.loadInventoryPins(runId);
    if (!result.success) {
      pushMessage('system', `背包置顶读取失败：${result.message ?? '未知错误'}`);
      return [];
    }
    return result.data;
  }

  async function applyLoadedGame(data: unknown, successMessage: string): Promise<boolean> {
    const loadedState = normalizeLoadedGameState(data);
    if (!loadedState) {
      pushMessage('system', '暂无存档数据。');
      return false;
    }

    const loadedPinnedKeys = await loadPinnedInventoryKeys(loadedState.runId);
    setGameState(loadedState);
    setMessages(createLoadedMessages(loadedState, successMessage));
    setPinnedInventoryKeys(loadedPinnedKeys);
    setQuickActions(getDefaultQuickActions(loadedState));
    return true;
  }

  async function persistGame(nextState: GameState, events: AppliedEvent[] = [], nextPinnedKeys = pinnedInventoryKeys): Promise<void> {
    const result = await hostClient.saveGame({ ...nextState, pendingEvents: events });
    if (!result.success) {
      pushMessage('system', `自动存档失败：${result.message}`);
      return;
    }
    await persistInventoryPins(nextState.runId, nextPinnedKeys);
  }

  async function sendAction(action?: string): Promise<void> {
    const text = (action ?? input).trim();
    if (!text || isSending)
      return;
    if (gameState.isDead) {
      pushMessage('system', '角色已经倒下，无法继续行动。');
      return;
    }

    setInput('');
    setChoices([]);
    setIsSending(true);
    pushMessage('user', text);

    const localResolution = resolveLocalAction(gameState, text);
    const localChanges = localResolution.changes;
    const localBaseState = structuredClone(gameState);
    localBaseState.chatHistory = [...gameState.chatHistory, { role: 'user', content: text }];
    const localApplied: ApplyResourceResult = localChanges.length > 0 ? applyResourceChanges(localBaseState, localChanges) : { nextState: localBaseState, summary: '', events: [] };
    const stateForAI = localApplied.nextState;
    const history = [
      ...gameState.chatHistory,
      { role: 'system', content: buildPlayerStatus(stateForAI) },
      { role: 'system', content: localResolution.aiInstruction },
    ];

    try {
      const result = await hostClient.sendMessage({ message: text, history });
      if (!result.success) {
        if (localChanges.length > 0) {
          setGameState(stateForAI);
          setQuickActions(getDefaultQuickActions(stateForAI));
          if (localApplied.summary)
            pushMessage('system', localApplied.summary);
          await persistGame(stateForAI, localApplied.events);
        }
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

      const baseState = structuredClone(stateForAI);
      baseState.chatHistory = [...stateForAI.chatHistory, { role: 'assistant', content: displayText }];
      const remoteChanges = removeRemoteChangesCoveredByLocal(changes, localChanges);
      const applied: ApplyResourceResult = remoteChanges.length > 0 ? applyResourceChanges(baseState, remoteChanges) : { nextState: baseState, summary: '', events: [] };
      const nextState = applied.nextState;
      const events = [...localApplied.events, ...applied.events];
      const summary = [localApplied.summary, applied.summary].filter(Boolean).join('\n');

      setQuickActions(mergeQuickActions(nextState, quick.actions));

      if (summary)
        pushMessage('system', summary);
      if (applied.breakthroughRealm || localApplied.breakthroughRealm) {
        setBreakthroughRealm(applied.breakthroughRealm ?? localApplied.breakthroughRealm ?? '');
        setTimeout(setBreakthroughRealm, 2600, '');
      }
      if (nextState.stats.hp <= 0) {
        nextState.isDead = true;
        void hostClient.saveDeathArchive(nextState).catch(error => reportAsyncError('死亡归档', error));
      }

      setGameState(nextState);
      await persistGame(nextState, events);
    }
    catch (error) {
      pushMessage('system', `通信错误：${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
      setIsSending(false);
    }
  }

  function openInventory(item?: InventoryItem): void {
    let selectedKey = selectedInventoryKey;
    if (item) {
      selectedKey = getInventoryItemKey(item);
    }
    else if (!selectedKey && gameState.inventory[0]) {
      selectedKey = getInventoryItemKey(gameState.inventory[0]);
    }
    setSelectedInventoryKey(selectedKey);
    setInventoryOpen(true);
  }

  function selectInventoryItem(item: InventoryItem): void {
    setSelectedInventoryKey(getInventoryItemKey(item));
    setInventoryOpen(true);
  }

  function toggleInventoryPin(item: InventoryItem): void {
    const key = getInventoryItemKey(item);
    setPinnedInventoryKeys((current) => {
      const nextPinnedKeys = current.includes(key) ? current.filter(itemKey => itemKey !== key) : [key, ...current];
      void persistInventoryPins(gameState.runId, nextPinnedKeys).catch(error => reportAsyncError('背包置顶保存', error));
      return nextPinnedKeys;
    });
  }

  async function activateInventoryItem(item: InventoryItem): Promise<void> {
    await sendAction(`使用${item.name}`);
  }

  async function openSettings(): Promise<void> {
    const result = await hostClient.loadAIConfig();
    if (result.success && result.data && typeof result.data === 'object') {
      const loaded = result.data as Record<string, unknown>;
      const type = (loaded.type ?? 'openai') as AIConfigForm['type'];
      const providerApiKeys = {
        ...defaultConfig.providerApiKeys,
        ...(loaded.providerApiKeys as Partial<AIConfigForm['providerApiKeys']> | undefined),
      };
      const providerBaseURLs = {
        ...defaultConfig.providerBaseURLs,
        ...(loaded.providerBaseURLs as Partial<AIConfigForm['providerBaseURLs']> | undefined),
      };
      const apiKey = String(loaded.apiKey ?? providerApiKeys[type] ?? '');
      const baseURL = String(loaded.baseURL ?? providerBaseURLs[type] ?? '');
      providerApiKeys[type] = apiKey;
      providerBaseURLs[type] = baseURL;
      setConfig({
        type,
        baseURL,
        apiKey,
        providerApiKeys,
        providerBaseURLs,
        model: String(loaded.model ?? ''),
        modelCatalog: createDefaultModelCatalog(loaded.modelCatalog as Partial<AIModelCatalog>),
        maxTokens: String(loaded.maxTokens ?? 2048),
        temperature: String(loaded.temperature ?? 0.7),
        systemPrompt: String(loaded.systemPrompt ?? ''),
        novelApiProvider: normalizeNovelApiProvider(loaded.novelApiProvider),
        novelApiBaseURL: String(loaded.novelApiBaseURL ?? defaultNovelApiBaseURL),
        novelApiKey: String(loaded.novelApiKey ?? defaultNovelApiKey),
        novelApiBuildRequestCode: String(loaded.novelApiBuildRequestCode ?? defaultNovelApiBuildRequestCode),
        novelApiMapResponseCode: String(loaded.novelApiMapResponseCode ?? defaultNovelApiMapResponseCode),
      });
    }
    setSettingsOpen(true);
  }

  async function saveSettings(): Promise<void> {
    const { type, baseURL, apiKey, providerApiKeys, providerBaseURLs, model, modelCatalog, maxTokens, temperature, novelApiProvider, novelApiBaseURL, novelApiKey, novelApiBuildRequestCode, novelApiMapResponseCode } = config;
    const nextProviderApiKeys = { ...providerApiKeys, [type]: apiKey };
    const nextProviderBaseURLs = { ...providerBaseURLs, [type]: baseURL };
    await hostClient.saveAIConfig({ type, baseURL, apiKey, providerApiKeys: nextProviderApiKeys, providerBaseURLs: nextProviderBaseURLs, model, modelCatalog, maxTokens: Number(maxTokens), temperature: Number(temperature), novelApiProvider, novelApiBaseURL, novelApiKey, novelApiBuildRequestCode, novelApiMapResponseCode });
    pushMessage('system', '模型配置已保存并生效。');
    setSettingsOpen(false);
  }

  async function saveGame(): Promise<void> {
    const result = await hostClient.saveGame(gameState);
    if (result.success) {
      await persistInventoryPins(gameState.runId, pinnedInventoryKeys);
      if (result.data)
        setGameState(normalizeLoadedGameState(result.data) ?? gameState);
      await refreshGameSaves();
    }
    pushMessage('system', result.success ? '存档成功。' : `存档失败：${result.message}`);
  }

  async function loadGame(): Promise<boolean> {
    const result = await hostClient.loadGame();
    if (!result.success) {
      pushMessage('system', `读档失败：${result.message ?? '未知错误'}`);
      return false;
    }
    return applyLoadedGame(result.data, '读档成功。');
  }

  async function loadGameByRunId(runId: string): Promise<boolean> {
    const result = await hostClient.loadGameByRunId(runId);
    if (!result.success) {
      pushMessage('system', `读档失败：${result.message ?? '未知错误'}`);
      return false;
    }
    return applyLoadedGame(result.data, '读档成功。');
  }

  async function deleteGameSave(runId: string): Promise<boolean> {
    const result = await hostClient.deleteGameSave(runId);
    if (!result.success) {
      setSaveListMessage(result.message);
      return false;
    }

    if (runId === gameState.runId)
      clearCurrentGameSession('当前存档已删除，运行状态已清空。');

    await refreshGameSaves();
    return true;
  }

  async function startNewGame(novelInput: NovelSummary | string = availableNovelScenarios[0].referenceNovel, difficulty: Difficulty = 'normal', themeId?: GameThemeId, themeSource: GameThemeSource = 'novel-auto', gameTypeId?: GameTypeId): Promise<boolean> {
    const novel = normalizeNovelStartInput(novelInput);
    const resolvedThemeId = themeId ?? inferThemeIdFromNovel(novel.title, novel.description);
    const resolvedGameTypeId = gameTypeId ?? inferGameTypeFromNovel(novel.title, novel.description);
    setNewGameMessage('');

    const scenarioResult = await hostClient.generateScenario({
      referenceNovel: novel.title,
      author: novel.author,
      description: novel.description,
      difficulty,
      gameTypeId: resolvedGameTypeId,
      themeId: resolvedThemeId,
    });
    if (!scenarioResult.success || !scenarioResult.data) {
      setNewGameMessage(scenarioResult.message ?? 'AI 开局生成失败，请检查模型配置。');
      return false;
    }

    const generatedSeed = scenarioResult.data as ScenarioGenerationSeed;
    const nextState = cloneScenarioInitialState(createScenarioFromNovelTitle(novel.title, resolvedThemeId, themeSource, resolvedGameTypeId, generatedSeed));
    nextState.difficulty = difficulty;
    const nextPinnedKeys = [...pinnedItems];
    setGameState(nextState);
    setPinnedInventoryKeys(nextPinnedKeys);
    setMessages([createMessage('system', nextState.scenario.openingMessage)]);
    setQuickActions(nextState.scenario.initialQuickActions?.length ? nextState.scenario.initialQuickActions : getDefaultQuickActions(nextState));
    setChoices([]);
    setSelectedInventoryKey(null);
    await persistGame(nextState, [], nextPinnedKeys);
    await refreshGameSaves();
    return true;
  }

  function changeGameTheme(themeId: GameThemeId): void {
    setGameState((current) => {
      const next = structuredClone(current);
      next.themeId = themeId;
      next.themeSource = 'user-override';
      next.scenario = { ...next.scenario, themeId, themeSource: 'user-override' };
      void persistGame(next).then(refreshGameSaves).catch(error => reportAsyncError('主题保存', error));
      return next;
    });
  }

  function resetGame(): void {
    void startNewGame(gameState.scenario.referenceNovel, gameState.difficulty, gameState.themeId, gameState.themeSource, gameState.gameTypeId).catch(error => reportAsyncError('重开存档', error));
  }

  function revivePlayer(): void {
    setGameState((current) => {
      const next = structuredClone(current);
      const reviveToken = next.inventory.find(item => item.name === reviveTokenItemName);
      if (reviveToken)
        reviveToken.count -= 1;
      next.inventory = next.inventory.filter(item => item.count > 0);
      next.stats.hp = Math.floor(next.stats.maxHp * 0.5);
      next.stats.mp = Math.floor(next.stats.maxMp * 0.3);
      next.attributes = syncAttributesFromStats(next.attributes, next.stats);
      next.isDead = false;
      const revivalScene = next.scenes[next.currentScene] ? next.currentScene : next.scenario.initialSceneName;
      next.character.location = revivalScene;
      next.currentScene = revivalScene;
      void persistGame(next).catch(error => reportAsyncError('复活存档', error));
      return next;
    });
    pushMessage('system', `你消耗了 1 个${reviveTokenItemName}，在当前剧本中重新站起。`);
  }

  function dropInventoryItem(index: number): void {
    const removedItem = gameState.inventory[index];
    const removedKey = removedItem ? getInventoryItemKey(removedItem) : null;
    const nextPinnedKeys = removedKey ? pinnedInventoryKeys.filter(key => key !== removedKey) : pinnedInventoryKeys;
    setPinnedInventoryKeys(nextPinnedKeys);
    setGameState((current) => {
      const next = structuredClone(current);
      next.inventory.splice(index, 1);
      void persistGame(next, [], nextPinnedKeys).catch(error => reportAsyncError('背包存档', error));
      return next;
    });
    if (removedKey && selectedInventoryKey === removedKey) {
      setSelectedInventoryKey(null);
    }
  }

  const canRevive = gameState.inventory.some(item => item.name === reviveTokenItemName && item.count >= 1);

  return {
    gameState,
    messages,
    input,
    quickActions: displayedQuickActions,
    choices,
    isSending,
    isLoadingSaves,
    saveListMessage,
    settingsOpen,
    inventoryOpen,
    selectedInventoryKey,
    pinnedInventoryKeys,
    breakthroughRealm,
    config,
    viewportRef,
    gameSaves,
    novels,
    sceneNpcs,
    canRevive,
    isSearchingNovels,
    novelSearchMessage,
    newGameMessage,
    setInput,
    setSettingsOpen,
    setInventoryOpen,
    setConfig,
    openInventory,
    selectInventoryItem,
    toggleInventoryPin,
    activateInventoryItem,
    dropInventoryItem,
    sendAction,
    openSettings,
    saveSettings,
    refreshGameSaves,
    searchNovels,
    saveGame,
    loadGame,
    loadGameByRunId,
    deleteGameSave,
    startNewGame,
    changeGameTheme,
    resetGame,
    revivePlayer,
  };
}
