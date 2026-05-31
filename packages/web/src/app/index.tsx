import type { ReactElement } from 'react';
import type { AppProps } from './types';
import { useState } from 'react';
import { AppHeader, BreakthroughOverlay, ChatPanel, DeathOverlay, InventoryDialog, MainMenu, SettingsDialog, StatusSidebar } from '@/components/game';
import { useGameSession } from '@/hooks';

export function App({ hostClient }: AppProps): ReactElement {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const {
    activateInventoryItem,
    breakthroughRealm,
    choices,
    config,
    dropInventoryItem,
    gameState,
    gameSaves,
    hasReviveStone,
    input,
    inventoryOpen,
    isLoadingSaves,
    isSearchingNovels,
    isSending,
    loadGameByRunId,
    loadGame,
    messages,
    novels,
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

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MainMenu
          saves={gameSaves}
          loading={isLoadingSaves}
          message={saveListMessage}
          novels={novels}
          novelSearchMessage={novelSearchMessage}
          searchingNovels={isSearchingNovels}
          onNewGame={novelTitle => enterGameAfter(() => startNewGame(novelTitle))}
          onLoadSave={runId => enterGameAfter(() => loadGameByRunId(runId))}
          onOpenSettings={openSettings}
          onRefreshSaves={() => void refreshGameSaves()}
          onSearchNovels={searchNovels}
        />
        <SettingsDialog open={settingsOpen} config={config} onOpenChange={setSettingsOpen} onConfigChange={setConfig} onSave={saveSettings} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader difficulty={gameState.difficulty} onOpenMenu={openMenu} onOpenSettings={openSettings} onSave={saveGame} onLoad={loadGame} />
      <main className="flex min-h-0 flex-1">
        <ChatPanel messages={messages} viewportRef={viewportRef} characterName={gameState.character.name} choices={choices} quickActions={quickActions} input={input} isSending={isSending} onInputChange={setInput} onSend={sendAction} />
        <StatusSidebar gameState={gameState} sceneNpcs={sceneNpcs} selectedInventoryKey={selectedInventoryKey} pinnedInventoryKeys={pinnedInventoryKeys} onOpenInventory={openInventory} onSelectInventoryItem={selectInventoryItem} onUseInventoryItem={activateInventoryItem} onDropInventoryItem={dropInventoryItem} onToggleInventoryPin={toggleInventoryPin} />
      </main>
      <SettingsDialog open={settingsOpen} config={config} onOpenChange={setSettingsOpen} onConfigChange={setConfig} onSave={saveSettings} />
      <InventoryDialog open={inventoryOpen} items={gameState.inventory} selectedInventoryKey={selectedInventoryKey} pinnedInventoryKeys={pinnedInventoryKeys} onOpenChange={setInventoryOpen} onSelectItem={selectInventoryItem} onUseItem={activateInventoryItem} onDropItem={dropInventoryItem} onTogglePin={toggleInventoryPin} />
      {gameState.isDead ? <DeathOverlay hard={gameState.difficulty === 'hard'} canRevive={hasReviveStone} onRevive={revivePlayer} onRestart={resetGame} /> : null}
      <BreakthroughOverlay realm={breakthroughRealm} />
    </div>
  );
}
