import type { ReactElement } from 'react';
import type { AppProps } from './types';
import { AppHeader, BreakthroughOverlay, ChatPanel, DeathOverlay, InventoryDialog, SettingsDialog, StatusSidebar } from '@/components/game';
import { useGameSession } from '@/hooks';

export function App({ hostClient }: AppProps): ReactElement {
  const {
    breakthroughRealm,
    changeDifficulty,
    choices,
    config,
    dropItem,
    gameState,
    hasReviveStone,
    input,
    inventoryOpen,
    isSending,
    loadGame,
    messages,
    openSettings,
    quickActions,
    resetGame,
    revivePlayer,
    saveGame,
    saveSettings,
    sceneNpcs,
    sendAction,
    setConfig,
    setInput,
    setInventoryOpen,
    setSettingsOpen,
    settingsOpen,
    viewportRef,
  } = useGameSession(hostClient);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader difficulty={gameState.difficulty} onOpenSettings={openSettings} onSave={saveGame} onLoad={loadGame} />
      <main className="flex min-h-0 flex-1">
        <ChatPanel messages={messages} viewportRef={viewportRef} characterName={gameState.character.name} choices={choices} quickActions={quickActions} input={input} isSending={isSending} onInputChange={setInput} onSend={sendAction} />
        <StatusSidebar gameState={gameState} sceneNpcs={sceneNpcs} onOpenInventory={() => setInventoryOpen(true)} />
      </main>
      <SettingsDialog open={settingsOpen} config={config} difficulty={gameState.difficulty} onOpenChange={setSettingsOpen} onConfigChange={setConfig} onDifficultyChange={changeDifficulty} onSave={saveSettings} />
      <InventoryDialog open={inventoryOpen} items={gameState.inventory} onOpenChange={setInventoryOpen} onUseItem={name => sendAction(`使用${name}`)} onDropItem={dropItem} />
      {gameState.isDead ? <DeathOverlay hard={gameState.difficulty === 'hard'} canRevive={hasReviveStone} onRevive={revivePlayer} onRestart={resetGame} /> : null}
      <BreakthroughOverlay realm={breakthroughRealm} />
    </div>
  );
}
