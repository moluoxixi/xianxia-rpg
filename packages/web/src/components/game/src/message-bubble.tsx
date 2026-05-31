import type { MessageBubbleProps } from './types';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveAssistantDialogue } from './utils';

export function MessageBubble({ message, characterName }: MessageBubbleProps) {
  const assistantDialogue = resolveAssistantDialogue(message.content);
  const displayContent = message.role === 'assistant' ? assistantDialogue.content : message.content;
  const meta = message.role === 'user'
    ? { name: characterName, icon: <User className="h-5 w-5" />, color: 'theme-speaker-user', align: 'justify-end' }
    : message.role === 'system'
      ? { name: '天道', icon: <span className="text-lg">卷</span>, color: 'theme-speaker-system', align: 'justify-start' }
      : { name: assistantDialogue.speakerName, icon: <Sparkles className="h-5 w-5" />, color: 'theme-speaker-assistant', align: 'justify-start' };

  return (
    <div className={cn('mb-4 flex gap-3 animate-fade-in', meta.align)}>
      {message.role !== 'user' ? <div className="theme-message-avatar grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg">{meta.icon}</div> : null}
      <div className={cn('max-w-[74%] rounded-xl border px-4 py-3', message.role === 'user' ? 'theme-message-user' : message.role === 'system' ? 'theme-message-system' : 'theme-message-assistant')}>
        <div className="mb-1 flex items-center gap-2">
          <span className={cn('text-xs font-bold', meta.color)}>{meta.name}</span>
          <span className="text-[11px] text-muted-foreground">{message.time}</span>
        </div>
        <div className="message-text whitespace-pre-wrap text-sm leading-7 text-foreground/90">{displayContent}</div>
      </div>
      {message.role === 'user' ? <div className="theme-message-avatar grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg">{meta.icon}</div> : null}
    </div>
  );
}
