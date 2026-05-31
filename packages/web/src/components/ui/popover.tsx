import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export function Popover({ children, className }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverContext value={{ open, setOpen }}>
      <span className={cn('relative inline-flex', className)}>{children}</span>
    </PopoverContext>
  );
}

export function PopoverTrigger({ children, onClick, type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = usePopoverContext();

  return (
    <button
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          setOpen(open => !open);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function PopoverClose({ children, onClick, type = 'button', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = usePopoverContext();

  return (
    <button
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end'; sideOffset?: number }
>(({ className, align = 'center', sideOffset = 8, style, ...props }, ref) => {
  const { open } = usePopoverContext();
  if (!open)
    return null;

  return (
    <div
      ref={ref}
      role="dialog"
      className={cn('absolute z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none', getAlignClassName(align), className)}
      style={{ top: `calc(100% + ${sideOffset}px)`, ...style }}
      {...props}
    />
  );
});
PopoverContent.displayName = 'PopoverContent';

function usePopoverContext(): PopoverContextValue {
  const context = React.use(PopoverContext);
  if (!context)
    throw new Error('Popover 组件必须在 Popover 根组件内使用');
  return context;
}

function getAlignClassName(align: 'start' | 'center' | 'end'): string {
  if (align === 'start')
    return 'left-0';
  if (align === 'end')
    return 'right-0';
  return 'left-1/2 -translate-x-1/2';
}
