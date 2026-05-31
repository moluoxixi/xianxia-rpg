import type { NovelSummary } from '@xianxia-rpg/core';
import type { MainMenuProps } from './types';
import type { GameThemeId, GameThemeSource } from '@/domain';
import { BookOpen, Check, ChevronsUpDown, Clock3, FolderOpen, Loader2, Palette, Play, Plus, RefreshCw, Search, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Popover, PopoverClose, PopoverContent, PopoverTrigger, Select, buttonVariants } from '@/components/ui';
import { gameThemePresets, getGameThemePreset, inferThemeIdFromNovel, inferThemeIdFromSave, themeIds } from '@/domain';
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
  onDeleteSave,
  onLoadSave,
  onNewGame,
  onOpenSettings,
  onRefreshSaves,
  onSearchNovels,
}: MainMenuProps) {
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [loadSavesOpen, setLoadSavesOpen] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [novelFilter, setNovelFilter] = useState('');
  const [saveFilter, setSaveFilter] = useState('');
  const [selectedNovelId, setSelectedNovelId] = useState(novels[0]?.id ?? '');
  const [manualThemeId, setManualThemeId] = useState<GameThemeId | null>(null);
  const selectedNovel = novels.find(novel => novel.id === selectedNovelId) ?? novels[0];
  const latestSave = saves[0];
  const selectedNovelThemeId = selectedNovel ? inferThemeIdFromNovel(selectedNovel.title, selectedNovel.description) : activeThemeId;
  const selectedThemeId = manualThemeId ?? selectedNovelThemeId;
  const selectedThemeSource: GameThemeSource = manualThemeId ? 'user-override' : 'novel-auto';
  const visibleTheme = getGameThemePreset(newGameOpen ? selectedThemeId : activeThemeId);
  const latestSaveTheme = latestSave ? getGameThemePreset(inferThemeIdFromSave(latestSave)) : null;
  const visibleNovels = novels.filter(novel => matchesNovelFilter(novel, novelFilter));
  const visibleSaves = saves.filter(save => matchesSaveFilter(save, saveFilter));

  useEffect(() => {
    if (!newGameOpen)
      return undefined;

    const timer = window.setTimeout(() => {
      void onSearchNovels(novelFilter);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [newGameOpen, novelFilter, onSearchNovels]);

  function selectNovel(novelId: string): void {
    setSelectedNovelId(novelId);
    setManualThemeId(null);
  }

  function selectTheme(themeId: GameThemeId): void {
    setManualThemeId(themeId === selectedNovelThemeId ? null : themeId);
  }

  function startSelectedNovel(): void {
    if (!selectedNovel)
      return;

    onNewGame(selectedNovel.title, selectedThemeId, selectedThemeSource);
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

  async function deleteSelectedSave(runId: string): Promise<void> {
    setDeletingRunId(runId);
    try {
      await onDeleteSave(runId);
    }
    finally {
      setDeletingRunId(null);
    }
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
        <DialogContent className={cn('theme-dialog', visibleTheme.shellClassName)}>
          <DialogHeader>
            <DialogTitle>新开游戏</DialogTitle>
            <DialogDescription className="sr-only">选择参考小说和主题。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">参考小说</span>
              <Popover className="w-full">
                <PopoverTrigger
                  className={buttonVariants({ variant: 'outline', className: 'h-auto min-h-10 w-full justify-between gap-3 px-3 py-2 text-left font-normal' })}
                  aria-label="选择参考小说"
                >
                  <span className="min-w-0 flex-1 truncate">{selectedNovel ? formatNovelOption(selectedNovel) : '暂无可选小说'}</span>
                  {searchingNovels ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-full min-w-[320px] space-y-2 p-2">
                  <Input value={novelFilter} onChange={event => setNovelFilter(event.target.value)} placeholder="搜索小说名或作者" autoFocus />
                  <div className="max-h-56 overflow-y-auto">
                    {visibleNovels.map(novel => (
                      <PopoverClose
                        key={novel.id}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent"
                        onClick={() => selectNovel(novel.id)}
                      >
                        <Check className={cn('h-4 w-4 shrink-0', novel.id === selectedNovel?.id ? 'opacity-100' : 'opacity-0')} />
                        <span className="min-w-0 flex-1 truncate">{formatNovelOption(novel)}</span>
                      </PopoverClose>
                    ))}
                    {visibleNovels.length === 0
                      ? <div className="px-2 py-6 text-center text-sm text-muted-foreground">{searchingNovels ? '正在搜索小说...' : '没有匹配的小说'}</div>
                      : null}
                  </div>
                </PopoverContent>
              </Popover>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">主题</span>
              <Select value={selectedThemeId} onChange={event => selectTheme(event.target.value as GameThemeId)}>
                {themeIds.map(themeId => <option key={themeId} value={themeId}>{formatThemeOption(themeId)}</option>)}
              </Select>
            </label>
            {novelSearchMessage && novels.length === 0 ? <p className="rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs leading-5 text-destructive">{novelSearchMessage}</p> : null}
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
        <DialogContent className={cn('theme-dialog', visibleTheme.shellClassName)}>
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
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={saveFilter} onChange={event => setSaveFilter(event.target.value)} placeholder="搜索角色、参考小说、风格或场景" />
            </label>

            {message ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{message}</div> : null}

            <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              {visibleSaves.map((save) => {
                const saveTheme = getGameThemePreset(inferThemeIdFromSave(save));
                return (
                  <div
                    key={save.runId}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/60"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 rounded-sm p-1 text-left transition-colors hover:bg-accent"
                      onClick={() => loadSelectedSave(save.runId)}
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">{save.playerName}</span>
                          <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{save.realm}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex min-w-0 items-center gap-1 rounded-sm border border-border px-2 py-1">
                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{formatSaveReferenceText(save)}</span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1 rounded-sm border border-border px-2 py-1">
                            <Palette className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{formatSaveThemeText(saveTheme)}</span>
                          </span>
                        </div>
                        <div className="truncate text-sm text-muted-foreground">{save.currentScene}</div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatSaveTime(save.updatedAt)}
                      </div>
                      <Popover>
                        <PopoverTrigger className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={`删除 ${save.playerName} 的存档`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="space-y-3">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-foreground">删除这个存档？</div>
                            <p className="text-xs leading-5 text-muted-foreground">删除后会移除该存档及背包置顶记录；如果它是当前存档，会同步清空当前运行态。</p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <PopoverClose className={buttonVariants({ variant: 'secondary', size: 'sm' })}>取消</PopoverClose>
                            <PopoverClose className={buttonVariants({ variant: 'destructive', size: 'sm' })} disabled={deletingRunId === save.runId} onClick={() => void deleteSelectedSave(save.runId)}>
                              确认删除
                            </PopoverClose>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && saves.length === 0 ? <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">暂无存档，可以先新开游戏。</div> : null}
            {!loading && saves.length > 0 && visibleSaves.length === 0 ? <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">没有匹配的存档。</div> : null}
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

function matchesNovelFilter(novel: NovelSummary, keyword: string): boolean {
  const searchableText = `${novel.title} ${novel.author} ${novel.description}`.toLocaleLowerCase('zh-CN');
  return searchableText.includes(keyword.toLocaleLowerCase('zh-CN'));
}

function matchesSaveFilter(save: MainMenuProps['saves'][number], keyword: string): boolean {
  const theme = getGameThemePreset(inferThemeIdFromSave(save));
  const searchableText = [
    save.playerName,
    save.realm,
    save.currentScene,
    formatSaveReferenceNovel(save),
    theme.label,
    theme.tone,
  ].join(' ').toLocaleLowerCase('zh-CN');
  return searchableText.includes(keyword.toLocaleLowerCase('zh-CN'));
}

function formatSaveReferenceNovel(save: MainMenuProps['saves'][number]): string {
  return save.referenceNovel ?? '未记录';
}

function formatSaveReferenceText(save: MainMenuProps['saves'][number]): string {
  return `参考：${formatSaveReferenceNovel(save)}`;
}

function formatSaveThemeText(theme: ReturnType<typeof getGameThemePreset>): string {
  return `风格：${theme.label} / ${theme.tone}`;
}

function formatThemeOption(themeId: GameThemeId): string {
  const theme = gameThemePresets[themeId];
  return `${theme.label} / ${theme.tone}`;
}

function formatSaveTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
