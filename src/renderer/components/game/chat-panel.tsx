import type { RefObject } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage, Choice } from '@/domain/types';
import { MessageBubble } from './message-bubble';

interface ChatPanelProps {
  messages: ChatMessage[];
  viewportRef: RefObject<HTMLDivElement | null>;
  choices: Choice[];
  quickActions: string[];
  input: string;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onSend: (action?: string) => void;
}

export function ChatPanel({ messages, viewportRef, choices, quickActions, input, isSending, onInputChange, onSend }: ChatPanelProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col border-r border-border">
      <div ref={viewportRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
      </div>

      {choices.length > 0 ? (
        <div className="border-t border-border bg-muted/40 p-3">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {choices.map((choice) => (
              <Button key={`${choice.index}-${choice.text}`} variant="secondary" className="justify-start" onClick={() => onSend(choice.text)}>
                {choice.index}. {choice.text}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto border-t border-border bg-[#12122a] px-3 py-2">
        {quickActions.length === 0
          ? <span className="text-xs text-muted-foreground">等待 AI 生成当前场景快捷指令...</span>
          : quickActions.map((action) => <Button key={action} variant="secondary" size="sm" className="shrink-0 border border-border text-foreground/80 hover:border-primary/50" onClick={() => onSend(action)}>{action}</Button>)}
      </div>

      <div className="flex gap-2 border-t border-border bg-card p-3">
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="输入你的行动..."
          className="max-h-32 min-h-[48px] resize-none"
        />
        <Button className="h-auto px-5" onClick={() => onSend()} disabled={isSending}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}发送
        </Button>
      </div>
    </section>
  );
}
