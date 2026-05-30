import type { MessageBubbleProps } from './types';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveAssistantDialogue } from './utils';

export function MessageBubble({ message, characterName }: MessageBubbleProps) {
  const assistantDialogue = resolveAssistantDialogue(message.content);
  const displayContent = message.role === 'assistant' ? assistantDialogue.content : message.content;
  const meta = message.role === 'user'
    ? { name: characterName, icon: <User className="h-5 w-5" />, color: 'text-foreground', align: 'justify-end' }
    : message.role === 'system'
      ? { name: '天道', icon: <span className="text-lg">卷</span>, color: 'text-system-gold', align: 'justify-start' }
      : { name: assistantDialogue.speakerName, icon: <Sparkles className="h-5 w-5" />, color: 'text-ai-blue', align: 'justify-start' };

  return (
    <div className={cn('mb-4 flex gap-3 animate-fade-in', meta.align)}>
      {message.role !== 'user' ? <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-lg">{meta.icon}</div> : null}
      <div className={cn('max-w-[74%] rounded-xl border px-4 py-3', message.role === 'user' ? 'border-player-blue bg-player-blue' : message.role === 'system' ? 'border-system-gold/30 bg-card' : 'border-ai-blue/30 bg-card')}>
        <div className="mb-1 flex items-center gap-2">
          <span className={cn('text-xs font-bold', meta.color)}>{meta.name}</span>
          <span className="text-[11px] text-muted-foreground">{message.time}</span>
        </div>
        <div className="message-text whitespace-pre-wrap text-sm leading-7 text-foreground/90">{displayContent}</div>
      </div>
      {message.role === 'user' ? <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-lg">{meta.icon}</div> : null}
    </div>
  );
}
