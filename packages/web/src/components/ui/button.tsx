import type { VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonColor = 'accent' | 'secondary' | 'destructive' | (string & {});

type ButtonColorStyle = React.CSSProperties & {
  '--button-border-color'?: string;
  '--button-color'?: string;
  '--button-contrast-color'?: string;
  '--button-text-color'?: string;
};

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        theme: 'theme-button',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  color?: ButtonColor;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, color, style, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const buttonColorStyle = color === undefined ? undefined : createButtonColorStyle(color);
    const resolvedVariant = color === undefined ? variant : 'theme';
    const resolvedStyle = buttonColorStyle === undefined ? style : { ...buttonColorStyle, ...style };

    return <Comp className={cn(buttonVariants({ variant: resolvedVariant, size, className }))} ref={ref} style={resolvedStyle} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };

// The caller selects one semantic color; CSS derives border and hover state from it.
const buttonColorStyles: Record<string, ButtonColorStyle> = {
  accent: {
    '--button-border-color': 'var(--button-color)',
    '--button-color': 'var(--theme-accent, #e94560)',
    '--button-contrast-color': 'var(--theme-title, currentColor)',
    '--button-text-color': 'var(--theme-accent-text, #ffffff)',
  },
  destructive: {
    '--button-border-color': 'var(--button-color)',
    '--button-color': '#dc2626',
    '--button-contrast-color': 'var(--theme-title, currentColor)',
    '--button-text-color': '#ffffff',
  },
  secondary: {
    '--button-border-color': 'color-mix(in srgb, var(--button-color) var(--theme-button-border-opacity, 72%), var(--button-contrast-color))',
    '--button-color': 'var(--theme-control-bg, var(--theme-secondary, #2a2a5a))',
    '--button-contrast-color': 'var(--theme-title, currentColor)',
    '--button-text-color': 'var(--theme-title, #e0e0e0)',
  },
};

function createButtonColorStyle(color: ButtonColor): ButtonColorStyle {
  return buttonColorStyles[color] ?? {
    '--button-color': color,
    '--button-contrast-color': 'var(--theme-title, currentColor)',
    '--button-text-color': 'var(--theme-title, currentColor)',
  };
}
