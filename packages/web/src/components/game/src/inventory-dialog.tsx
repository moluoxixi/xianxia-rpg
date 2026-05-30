import type { InventoryDialogProps } from './types';
import { Pin, Trash2, Wand2 } from 'lucide-react';
import { InventoryItemEntry } from './inventory-item-entry';
import { Button, Card, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import { createInventoryViewItems, getItemIcon, itemDescriptions } from '@/domain';

export function InventoryDialog({
  items,
  onDropItem,
  onOpenChange,
  onSelectItem,
  onTogglePin,
  onUseItem,
  open,
  pinnedInventoryKeys,
  selectedInventoryKey,
}: InventoryDialogProps) {
  const viewItems = createInventoryViewItems(items, pinnedInventoryKeys);
  const selectedEntry = viewItems.find(entry => entry.key === selectedInventoryKey) ?? viewItems[0];
  const selectedItem = selectedEntry?.item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,860px)]">
        <DialogHeader>
          <DialogTitle>背包</DialogTitle>
          <DialogDescription className="sr-only">查看全部物品、详情和背包操作。</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[68vh] grid-cols-[minmax(220px,300px)_1fr] gap-4 p-5">
          <div className="min-h-0 overflow-y-auto pr-1">
            <div className="mb-2 text-xs text-muted-foreground">
              全部物品 · 右键操作
            </div>
            <div className="flex flex-col gap-2">
              {viewItems.length === 0
                ? <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">背包空空如也</div>
                : viewItems.map(entry => (
                    <InventoryItemEntry
                      key={`${entry.key}-${entry.index}`}
                      item={entry.item}
                      index={entry.index}
                      pinned={entry.pinned}
                      selected={entry.key === selectedEntry?.key}
                      onViewDetails={onSelectItem}
                      onUseItem={onUseItem}
                      onDropItem={onDropItem}
                      onTogglePin={onTogglePin}
                    />
                  ))}
            </div>
          </div>

          <Card className="min-h-[320px] p-4">
            {selectedItem && selectedEntry
              ? (
                  <div className="flex h-full flex-col">
                    <div className="flex items-start gap-3 border-b border-border pb-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-secondary text-xl font-semibold text-primary">
                        {getItemIcon(selectedItem.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <span className="truncate">{selectedItem.name}</span>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            x
                            {selectedItem.count}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedItem.description ?? itemDescriptions[selectedItem.name] ?? '未知物品'}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <DetailMeta label="类型" value={selectedItem.type ?? '未记录'} />
                      <DetailMeta label="品阶" value={selectedItem.rarity ?? '未记录'} />
                      <DetailMeta label="来源" value={selectedItem.sourceScene ?? '未记录'} />
                      <DetailMeta label="状态" value={selectedEntry.pinned ? '已置顶' : '未置顶'} />
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      <Button size="sm" onClick={() => onUseItem(selectedItem)}>
                        <Wand2 className="h-4 w-4" />
                        使用
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onTogglePin(selectedItem)}>
                        <Pin className="h-4 w-4" />
                        {selectedEntry.pinned ? '取消置顶' : '置顶'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDropItem(selectedEntry.index)}>
                        <Trash2 className="h-4 w-4" />
                        丢弃
                      </Button>
                    </div>
                  </div>
                )
              : <div className="grid h-full place-items-center text-sm text-muted-foreground">选择一个物品查看详情</div>}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/60 px-3 py-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}
