import type { ReactNode } from 'react';
import type { SettingsDialogProps } from './types';
import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import { getGameThemePreset } from '@/domain';
import { cn } from '@/lib/utils';
import { SettingsModelTab } from './settings-model-tab';
import { SettingsNovelApiTab } from './settings-novel-api-tab';

type SettingsTab = 'model' | 'novel-api';

export function SettingsDialog({ open, themeId, config, onOpenChange, onConfigChange, onSave }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('model');
  const theme = getGameThemePreset(themeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('theme-dialog', theme.shellClassName)}>
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription className="sr-only">配置 AI 模型和小说接口。</DialogDescription>
        </DialogHeader>
        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            <TabButton active={activeTab === 'model'} onClick={() => setActiveTab('model')}>模型</TabButton>
            <TabButton active={activeTab === 'novel-api'} onClick={() => setActiveTab('novel-api')}>小说 API</TabButton>
          </div>

          {activeTab === 'model'
            ? <SettingsModelTab config={config} onConfigChange={onConfigChange} />
            : <SettingsNovelApiTab config={config} onConfigChange={onConfigChange} />}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={onSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <Button type="button" variant={active ? 'default' : 'ghost'} size="sm" aria-selected={active} onClick={onClick}>
      {children}
    </Button>
  );
}
