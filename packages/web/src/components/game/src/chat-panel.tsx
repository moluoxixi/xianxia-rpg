import type { ChatPanelProps } from './types';
import { Loader2, Send } from 'lucide-react';
import React from 'react';
import { Button, Textarea } from '@/components/ui';
import { MessageBubble } from './message-bubble';

export function ChatPanel({ messages, viewportRef, characterName, choices, quickActions, input, isSending, onInputChange, onSend }: ChatPanelProps) {
  return (
    <section className="theme-game-chat flex min-w-0 flex-1 flex-col border-r border-border">
      <div ref={viewportRef} className="theme-game-chat-scroll flex-1 overflow-y-auto p-4">
        {messages.map(message => <MessageBubble key={message.id} message={message} characterName={characterName} />)}
      </div>

      {choices.length > 0
        ? (
            <div className="theme-game-choice-bar border-t border-border p-3">
              <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {choices.map(choice => (
                  <Button key={`${choice.index}-${choice.text}`} color="secondary" className="justify-start" onClick={() => onSend(choice.text)}>
                    {choice.index}
                    .
                    {choice.text}
                  </Button>
                ))}
              </div>
            </div>
          )
        : null}

      <div className="theme-game-quick-actions flex gap-1.5 overflow-x-auto border-t border-border px-3 py-2">
        {quickActions.length === 0
          ? <span className="text-xs text-muted-foreground">等待 AI 生成当前场景快捷指令...</span>
          : quickActions.map(action => <Button key={action} color="secondary" size="sm" className="shrink-0" onClick={() => onSend(action)}>{action}</Button>)}
      </div>

      <div className="theme-game-input-bar flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={input}
          onChange={event => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="输入你的行动..."
          className="max-h-32 min-h-[48px] resize-none"
        />
        <Button type="button" color="accent" size="default" className="h-12 shrink-0 px-5" onClick={() => onSend()} disabled={isSending}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          发送
        </Button>
      </div>
    </section>
  );
}
