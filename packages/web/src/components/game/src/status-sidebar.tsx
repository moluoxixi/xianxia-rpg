import type { NPC } from '@xianxia-rpg/core';
import type { ReactNode } from 'react';
import type { StatusSidebarProps } from './types';
import { BookOpen, ChevronRight, Heart, Map, MessageSquare, Package, Shield, Sparkles, User, Waves } from 'lucide-react';
import { Card } from '@/components/ui';
import { InventoryItemEntry } from './inventory-item-entry';
import { createInventoryViewItems, statPercent } from '@/domain';

export function StatusSidebar({
  gameState,
  onDropInventoryItem,
  onOpenInventory,
  onSelectInventoryItem,
  onToggleInventoryPin,
  onUseInventoryItem,
  pinnedInventoryKeys,
  sceneNpcs,
  selectedInventoryKey,
}: StatusSidebarProps) {
  const inventoryItems = createInventoryViewItems(gameState.inventory, pinnedInventoryKeys);

  return (
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
          {(gameState.scenes[gameState.currentScene]?.connectedScenes ?? []).map(scene => <span key={scene} className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground">{scene}</span>)}
        </div>
      </Card>

      <Card className="mb-4 p-3 transition-colors hover:border-primary/50">
        <button type="button" className="w-full text-left" onClick={() => onOpenInventory()}>
          <PanelTitle icon={<Package className="h-4 w-4" />} title="背包" action="点击查看全部" />
        </button>
        <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
          {inventoryItems.length === 0
            ? <div className="rounded border border-dashed border-border py-4 text-center text-xs text-muted-foreground">背包空空如也</div>
            : inventoryItems.map(entry => (
                <InventoryItemEntry
                  key={`${entry.key}-${entry.index}`}
                  compact
                  item={entry.item}
                  index={entry.index}
                  pinned={entry.pinned}
                  selected={entry.key === selectedInventoryKey}
                  onViewDetails={onSelectInventoryItem}
                  onUseItem={onUseInventoryItem}
                  onDropItem={onDropInventoryItem}
                  onTogglePin={onToggleInventoryPin}
                />
              ))}
        </div>
      </Card>

      <Card className="mb-4 p-3">
        <PanelTitle icon={<BookOpen className="h-4 w-4" />} title="功法" />
        <div className="flex flex-col gap-1.5">
          {gameState.skills.map(skill => (
            <div key={skill.id ?? skill.name} className="rounded bg-secondary px-2 py-1.5 text-xs text-foreground/80">
              {skill.name}
              （
              {skill.level}
              ）
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-3">
        <PanelTitle icon={<MessageSquare className="h-4 w-4" />} title="场景 NPC" />
        {sceneNpcs.length === 0 ? <p className="text-xs text-muted-foreground">当前暂无已记录 NPC</p> : sceneNpcs.map(npc => <NpcRow key={npc.id} npc={npc} />)}
      </Card>
    </aside>
  );
}

function PanelTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between border-b border-border pb-1.5 text-sm font-semibold text-primary">
      <span className="flex items-center gap-2">
        {icon}
        {title}
      </span>
      {action ? <span className="text-[10px] font-normal text-muted-foreground">{action}</span> : null}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="mb-2 flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'text-primary' : 'text-foreground'}>{value}</span>
    </div>
  );
}

function StatBar({ icon, label, value, max, className }: { icon: ReactNode; label: string; value: number; max: number; className: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span>
          {value}
          /
          {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full bg-gradient-to-r transition-all ${className}`} style={{ width: statPercent(value, max) }} /></div>
    </div>
  );
}

function NpcRow({ npc }: { npc: NPC }) {
  return (
    <div className="mb-2 rounded-md border border-border bg-secondary/60 p-2 text-xs">
      <div className="flex items-center justify-between text-foreground">
        <span>{npc.name}</span>
        <span className="text-muted-foreground">
          好感
          {npc.favorability}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-muted-foreground">
        <ChevronRight className="h-3 w-3" />
        {npc.realm}
        {' '}
        /
        {npc.role}
      </div>
    </div>
  );
}
