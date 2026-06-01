import type { InventoryItemEntryProps } from './types';
import { Eye, Hand, Pin, PinOff, Trash2 } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getItemIcon, itemDescriptions } from '@/domain';

export function InventoryItemEntry({
  compact,
  index,
  item,
  onDropItem,
  onTogglePin,
  onUseItem,
  onViewDetails,
  pinned,
  selected,
}: InventoryItemEntryProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          title={item.description ?? itemDescriptions[item.name] ?? '未知物品'}
          className={cn(
            'group flex w-full items-center gap-2 rounded-md border border-border bg-secondary/70 text-left text-foreground/90 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm',
            selected ? 'border-primary/70 bg-primary/10' : '',
          )}
          onClick={() => onViewDetails(item)}
        >
          <span className={cn('grid shrink-0 place-items-center rounded bg-card font-semibold text-primary', compact ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm')}>
            {getItemIcon(item)}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {item.name}
          </span>
          <span className="shrink-0 text-foreground">
            x
            {item.count}
          </span>
          {pinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onViewDetails(item)}>
          <Eye className="h-4 w-4" />
          查看详情
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onUseItem(item)}>
          <Hand className="h-4 w-4" />
          使用
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onTogglePin(item)}>
          {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          {pinned ? '取消置顶' : '置顶'}
        </ContextMenuItem>
        <ContextMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDropItem(index)}>
          <Trash2 className="h-4 w-4" />
          丢弃
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
