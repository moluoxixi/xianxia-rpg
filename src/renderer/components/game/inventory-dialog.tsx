import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getItemIcon, itemDescriptions } from '@/domain/game-data';
import type { InventoryItem } from '@/domain/types';

interface InventoryDialogProps {
  open: boolean;
  items: InventoryItem[];
  onOpenChange: (open: boolean) => void;
  onUseItem: (name: string) => void;
  onDropItem: (index: number) => void;
}

export function InventoryDialog({ open, items, onOpenChange, onUseItem, onDropItem }: InventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)]">
        <DialogHeader><DialogTitle>背包</DialogTitle></DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-5">
          {items.length === 0 ? <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">背包空空如也</div> : items.map((item, index) => (
            <Card key={`${item.id ?? item.name}-${index}`} className="p-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-sm font-semibold text-primary">{getItemIcon(item.name)}</div>
              <div className="mt-2 text-sm font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground">×{item.count}</div>
              <p className="mt-2 min-h-8 text-xs text-muted-foreground">{item.description ?? itemDescriptions[item.name] ?? '未知物品'}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onUseItem(item.name)}>使用</Button>
                <Button size="sm" variant="destructive" onClick={() => onDropItem(index)}>丢弃</Button>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
