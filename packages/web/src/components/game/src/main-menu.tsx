import type { NovelSummary } from '@xianxia-rpg/core';
import type { MainMenuProps } from './types';
import type { FormEvent } from 'react';
import { BookOpen, Clock3, FolderOpen, Play, Plus, RefreshCw, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Select } from '@/components/ui';
import { getGameThemePreset, inferThemeIdFromNovel, inferThemeIdFromSave } from '@/domain';
import { cn } from '@/lib/utils';

export function MainMenu({
  saves,
  novels,
  loading,
  searchingNovels,
  message,
  novelSearchMessage,
  activeThemeId,
  onContinueGame,
  onLoadSave,
  onNewGame,
  onOpenSettings,
  onRefreshSaves,
  onSearchNovels,
}: MainMenuProps) {
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [loadSavesOpen, setLoadSavesOpen] = useState(false);
  const [novelKeyword, setNovelKeyword] = useState('');
  const [selectedNovelId, setSelectedNovelId] = useState(novels[0]?.id ?? '');
  const selectedNovel = novels.find(novel => novel.id === selectedNovelId) ?? novels[0];
  const latestSave = saves[0];
  const selectedNovelThemeId = selectedNovel ? inferThemeIdFromNovel(selectedNovel.title, selectedNovel.description) : activeThemeId;
  const visibleTheme = getGameThemePreset(newGameOpen && selectedNovel ? selectedNovelThemeId : activeThemeId);
  const latestSaveTheme = latestSave ? getGameThemePreset(inferThemeIdFromSave(latestSave)) : null;

  useEffect(() => {
    if (newGameOpen)
      void onSearchNovels('');
  }, [newGameOpen, onSearchNovels]);

  function searchNovel(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onSearchNovels(novelKeyword);
  }

  function startSelectedNovel(): void {
    if (!selectedNovel)
      return;

    onNewGame(selectedNovel.title, selectedNovelThemeId);
    setNewGameOpen(false);
  }

  function openLoadSaves(): void {
    setLoadSavesOpen(true);
    void onRefreshSaves();
  }

  function loadSelectedSave(runId: string): void {
    setLoadSavesOpen(false);
    onLoadSave(runId);
  }

  return (
    <main className={cn('theme-shell flex min-h-screen items-center justify-center p-6 text-foreground', visibleTheme.shellClassName)}>
      <Card className="theme-menu-card flex w-full max-w-[440px] flex-col justify-between p-6">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="theme-avatar" aria-hidden="true">{visibleTheme.avatarText}</div>
            <div className="min-w-0 space-y-2">
              <div className="theme-eyebrow text-sm font-medium">AI 文字冒险</div>
              <h1 className="theme-title text-3xl font-semibold tracking-normal">半开放式剧本 RPG</h1>
              <p className="theme-description text-sm leading-6">选择参考小说后开局，系统会自动生成初始身份、场景和剧本基调。</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className={cn('w-full justify-start', latestSave ? 'theme-soft-action' : 'theme-primary-action')} variant={latestSave ? 'secondary' : 'default'} onClick={() => setNewGameOpen(true)}>
              <Plus className="h-4 w-4" />
              新开游戏
            </Button>
            {latestSave
              ? (
                  <Button className="theme-primary-action w-full justify-start" onClick={onContinueGame}>
                    <Play className="h-4 w-4" />
                    继续游戏
                  </Button>
                )
              : null}
            <Button className="w-full justify-start" variant="secondary" onClick={openLoadSaves}>
              <FolderOpen className="h-4 w-4" />
              读取存档
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
              设置
            </Button>
          </div>
        </div>

        <div className="theme-status rounded-md border p-3 text-xs leading-5">
          {latestSave && latestSaveTheme
            ? `当前主题：${latestSaveTheme.label} / 最近存档：${latestSave.playerName}，${latestSave.currentScene}`
            : `默认主题：${visibleTheme.label} / 当前没有可继续的存档`}
        </div>
      </Card>

      <Dialog open={newGameOpen} onOpenChange={setNewGameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新开游戏</DialogTitle>
            <DialogDescription className="sr-only">搜索并选择参考小说。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <form className="flex gap-2" onSubmit={searchNovel}>
              <Input value={novelKeyword} onChange={event => setNovelKeyword(event.target.value)} placeholder="搜索小说名或作者" />
              <Button type="submit" size="icon" disabled={searchingNovels} aria-label="搜索小说">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">参考小说</span>
              <Select value={selectedNovel?.id ?? ''} onChange={event => setSelectedNovelId(event.target.value)} disabled={novels.length === 0 || searchingNovels}>
                {novels.map(novel => (
                  <option key={novel.id} value={novel.id}>{formatNovelOption(novel)}</option>
                ))}
              </Select>
            </label>
            {novelSearchMessage ? <p className="rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs leading-5 text-destructive">{novelSearchMessage}</p> : null}
            <p className="min-h-10 text-xs leading-5 text-muted-foreground">
              {selectedNovel ? `${selectedNovel.description} 来源：${selectedNovel.source}，预览主题：${getGameThemePreset(selectedNovelThemeId).label}` : '暂无可用参考小说'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setNewGameOpen(false)}>取消</Button>
              <Button disabled={!selectedNovel || searchingNovels} onClick={startSelectedNovel}>
                <BookOpen className="h-4 w-4" />
                新开游戏
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loadSavesOpen} onOpenChange={setLoadSavesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>读取存档</DialogTitle>
            <DialogDescription className="sr-only">按更新时间排序，选择任意存档进入。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">按更新时间排序，选择任意存档进入。</p>
              <Button size="sm" variant="outline" onClick={onRefreshSaves}>
                <RefreshCw className="h-4 w-4" />
                刷新
              </Button>
            </div>

            {message ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{message}</div> : null}

            <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              {saves.map(save => (
                <button
                  key={save.runId}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
                  onClick={() => loadSelectedSave(save.runId)}
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
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatNovelOption(novel: NovelSummary): string {
  return `${novel.title} / ${novel.author}`;
}

function formatSaveTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
