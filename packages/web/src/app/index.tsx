import type { ReactElement } from 'react';
import type { AppProps } from './types';
import { useState } from 'react';
import { AppHeader, BreakthroughOverlay, ChatPanel, DeathOverlay, InventoryDialog, MainMenu, SettingsDialog, StatusSidebar } from '@/components/game';
import { DEFAULT_THEME_ID, getGameThemePreset, getGameTypePreset, inferThemeIdFromSave, normalizeThemeId } from '@/domain';
import { useGameSession } from '@/hooks';
import { cn } from '@/lib/utils';

export function App({ hostClient }: AppProps): ReactElement {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const {
    activateInventoryItem,
    breakthroughRealm,
    choices,
    config,
    deleteGameSave,
    dropInventoryItem,
    gameState,
    gameSaves,
    canRevive,
    input,
    inventoryOpen,
    isLoadingSaves,
    isSearchingNovels,
    isSending,
    changeGameTheme,
    loadGameByRunId,
    loadGame,
    messages,
    novels,
    newGameMessage,
    novelSearchMessage,
    openInventory,
    openSettings,
    pinnedInventoryKeys,
    quickActions,
    refreshGameSaves,
    resetGame,
    revivePlayer,
    saveGame,
    saveListMessage,
    saveSettings,
    searchNovels,
    sceneNpcs,
    selectInventoryItem,
    selectedInventoryKey,
    sendAction,
    setConfig,
    setInput,
    setInventoryOpen,
    setSettingsOpen,
    settingsOpen,
    startNewGame,
    toggleInventoryPin,
    viewportRef,
  } = useGameSession(hostClient);

  function enterGameAfter(action: () => Promise<boolean>): void {
    void action().then((entered) => {
      if (entered)
        setScreen('game');
    });
  }

  function openMenu(): void {
    setScreen('menu');
    void refreshGameSaves();
  }

  const savedMenuThemeId = gameSaves[0] ? inferThemeIdFromSave(gameSaves[0]) : DEFAULT_THEME_ID;
  const activeMenuThemeId = savedMenuThemeId;
  const activeGameThemeId = normalizeThemeId(gameState.themeId ?? DEFAULT_THEME_ID);
  const activeGameTheme = getGameThemePreset(activeGameThemeId);
  const activeGameType = getGameTypePreset(gameState.gameTypeId);
  const gameHeaderTitle = gameState.scenario.referenceNovel || gameState.scenario.title;
  const gameHeaderSubtitle = `${activeGameType.label} · AI文字冒险`;

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MainMenu
          saves={gameSaves}
          loading={isLoadingSaves}
          message={saveListMessage}
          novels={novels}
          newGameMessage={newGameMessage}
          novelSearchMessage={novelSearchMessage}
          searchingNovels={isSearchingNovels}
          activeThemeId={activeMenuThemeId}
          onNewGame={(novel, themeId, themeSource, gameTypeId) => startNewGame(novel, 'normal', themeId, themeSource, gameTypeId).then((entered) => {
            if (entered)
              setScreen('game');
            return entered;
          })}
          onContinueGame={() => enterGameAfter(loadGame)}
          onDeleteSave={deleteGameSave}
          onLoadSave={runId => enterGameAfter(() => loadGameByRunId(runId))}
          onOpenSettings={openSettings}
          onRefreshSaves={() => void refreshGameSaves()}
          onSearchNovels={searchNovels}
        />
        <SettingsDialog open={settingsOpen} themeId={activeMenuThemeId} config={config} onOpenChange={setSettingsOpen} onConfigChange={setConfig} onSave={saveSettings} />
      </div>
    );
  }

  return (
    <div className={cn('theme-shell theme-game-shell flex h-screen flex-col text-foreground', activeGameTheme.shellClassName)}>
      <AppHeader difficulty={gameState.difficulty} themeId={activeGameThemeId} title={gameHeaderTitle} subtitle={gameHeaderSubtitle} onOpenMenu={openMenu} onOpenSettings={openSettings} onSave={saveGame} onLoad={loadGame} onThemeChange={changeGameTheme} />
      <main className="theme-game-layout flex min-h-0 flex-1">
        <ChatPanel messages={messages} viewportRef={viewportRef} characterName={gameState.character.name} choices={choices} quickActions={quickActions} input={input} isSending={isSending} onInputChange={setInput} onSend={sendAction} />
        <StatusSidebar gameState={gameState} sceneNpcs={sceneNpcs} selectedInventoryKey={selectedInventoryKey} pinnedInventoryKeys={pinnedInventoryKeys} onOpenInventory={openInventory} onSelectInventoryItem={selectInventoryItem} onUseInventoryItem={activateInventoryItem} onDropInventoryItem={dropInventoryItem} onToggleInventoryPin={toggleInventoryPin} />
      </main>
      <SettingsDialog open={settingsOpen} themeId={activeGameThemeId} config={config} onOpenChange={setSettingsOpen} onConfigChange={setConfig} onSave={saveSettings} />
      <InventoryDialog open={inventoryOpen} themeId={activeGameThemeId} items={gameState.inventory} selectedInventoryKey={selectedInventoryKey} pinnedInventoryKeys={pinnedInventoryKeys} onOpenChange={setInventoryOpen} onSelectItem={selectInventoryItem} onUseItem={activateInventoryItem} onDropItem={dropInventoryItem} onTogglePin={toggleInventoryPin} />
      {gameState.isDead ? <DeathOverlay hard={gameState.difficulty === 'hard'} canRevive={canRevive} onRevive={revivePlayer} onRestart={resetGame} /> : null}
      <BreakthroughOverlay realm={breakthroughRealm} />
    </div>
  );
}
