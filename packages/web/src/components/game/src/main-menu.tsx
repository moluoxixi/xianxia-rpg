import type { MainMenuProps } from './types';
import { CirclePlay, Clock3, FolderOpen, Plus, RefreshCw, Settings } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export function MainMenu({
  saves,
  loading,
  message,
  onContinue,
  onLoadSave,
  onNewGame,
  onOpenSettings,
  onRefreshSaves,
}: MainMenuProps) {
  const latestSave = saves[0];

  return (
    <main className="grid min-h-screen gap-6 bg-background p-6 text-foreground lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="flex flex-col justify-between p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">AI 修仙文字冒险</div>
            <h1 className="text-3xl font-semibold tracking-normal">凡人修仙传</h1>
            <p className="text-sm leading-6 text-muted-foreground">选择一个存档继续修行，或者从七玄门外门重新启程。</p>
          </div>

          <div className="space-y-3">
            <Button className="w-full justify-start" disabled={!latestSave || loading} onClick={onContinue}>
              <CirclePlay className="h-4 w-4" />
              继续游戏
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={onNewGame}>
              <Plus className="h-4 w-4" />
              新开游戏
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
              设置
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-border p-3 text-xs leading-5 text-muted-foreground">
          当前存档会独立保存背包置顶、角色状态和场景进度。
        </div>
      </Card>

      <Card className="min-h-0 p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">读取存档</h2>
            <p className="text-sm text-muted-foreground">按更新时间排序，选择任意存档进入。</p>
          </div>
          <Button size="sm" variant="outline" onClick={onRefreshSaves}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>

        {message ? <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{message}</div> : null}

        <div className="grid gap-3">
          {saves.map(save => (
            <button
              key={save.runId}
              type="button"
              className="flex w-full items-center justify-between gap-4 rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
              onClick={() => onLoadSave(save.runId)}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{save.playerName}</span>
                  <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{save.realm}</span>
                </div>
                <div className="truncate text-sm text-muted-foreground">{save.currentScene}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {formatSaveTime(save.updatedAt)}
              </div>
            </button>
          ))}
        </div>

        {!loading && saves.length === 0 ? <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无存档，可以先新开游戏。</div> : null}
        {loading ? <div className="rounded-md border border-border p-8 text-center text-sm text-muted-foreground">正在读取存档...</div> : null}
      </Card>
    </main>
  );
}

function formatSaveTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
