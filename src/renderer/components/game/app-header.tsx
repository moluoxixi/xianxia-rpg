import type { ReactNode } from 'react';
import { Archive, Save, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Difficulty } from '@/domain/types';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  difficulty: Difficulty;
  onOpenSettings: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export function AppHeader({ difficulty, onOpenSettings, onSave, onLoad }: AppHeaderProps) {
  return (
    <header className="app-region-drag flex items-center justify-between border-b-2 border-primary bg-[#13233d] px-5 py-2.5">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-[4px] text-primary">凡人修仙传</h1>
        <span className="border-l border-border pl-3 text-xs text-muted-foreground">AI修仙文字冒险</span>
      </div>
      <div className="app-region-no-drag flex items-center gap-2">
        <DifficultyBadge difficulty={difficulty} />
        <HeaderButton onClick={onOpenSettings} icon={<Settings className="h-4 w-4" />} label="设置" />
        <HeaderButton onClick={onSave} icon={<Save className="h-4 w-4" />} label="存档" />
        <HeaderButton onClick={onLoad} icon={<Archive className="h-4 w-4" />} label="读档" />
      </div>
    </header>
  );
}

function HeaderButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <Button variant="outline" size="sm" onClick={onClick}>{icon}{label}</Button>;
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cn('rounded border px-2.5 py-1 text-[11px]', difficulty === 'hard' ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-system-gold/50 bg-system-gold/10 text-system-gold')}>
      {difficulty === 'hard' ? '困难模式' : '简单模式'}
    </span>
  );
}
