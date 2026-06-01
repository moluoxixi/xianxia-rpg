import type { DeathOverlayProps } from './types';
import { RotateCcw, Sparkles, Swords } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export function DeathOverlay({ hard, canRevive, onRevive, onRestart }: DeathOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80">
      <Card className="w-[min(92vw,460px)] p-8 text-center">
        <Swords className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-3 text-2xl font-bold text-destructive">旅程中断</h2>
        <p className="mb-6 text-sm text-muted-foreground">{hard ? '困难模式下，这段旅程到此为止。' : canRevive ? '消耗 1 个复苏凭证可继续当前剧本。' : '缺少复苏凭证，无法继续当前剧本。'}</p>
        <div className="flex justify-center gap-3">
          {!hard
            ? (
                <Button disabled={!canRevive} onClick={onRevive}>
                  <Sparkles className="h-4 w-4" />
                  复活
                </Button>
              )
            : null}
          <Button variant="secondary" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" />
            重新开始
          </Button>
        </div>
      </Card>
    </div>
  );
}
