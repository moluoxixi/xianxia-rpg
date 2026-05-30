import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AIConfigForm, Difficulty } from '@/domain/types';

interface SettingsDialogProps {
  open: boolean;
  config: AIConfigForm;
  difficulty: Difficulty;
  onOpenChange: (open: boolean) => void;
  onConfigChange: (config: AIConfigForm) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onSave: () => void;
}

export function SettingsDialog({ open, config, difficulty, onOpenChange, onConfigChange, onDifficultyChange, onSave }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>模型与游戏设置</DialogTitle></DialogHeader>
        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="类型"><Input value={config.type} onChange={(event) => onConfigChange({ ...config, type: event.target.value })} /></Field>
            <Field label="模型"><Input value={config.model} onChange={(event) => onConfigChange({ ...config, model: event.target.value })} /></Field>
            <Field label="Base URL"><Input value={config.baseURL} onChange={(event) => onConfigChange({ ...config, baseURL: event.target.value })} /></Field>
            <Field label="API Key"><Input type="password" value={config.apiKey} onChange={(event) => onConfigChange({ ...config, apiKey: event.target.value })} /></Field>
            <Field label="Max Tokens"><Input value={config.maxTokens} onChange={(event) => onConfigChange({ ...config, maxTokens: event.target.value })} /></Field>
            <Field label="Temperature"><Input value={config.temperature} onChange={(event) => onConfigChange({ ...config, temperature: event.target.value })} /></Field>
          </div>
          <Field label="系统提示词"><Textarea className="min-h-[220px]" value={config.systemPrompt} onChange={(event) => onConfigChange({ ...config, systemPrompt: event.target.value })} /></Field>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <span className="text-sm text-muted-foreground">难度模式</span>
            <div className="flex gap-2">
              <Button variant={difficulty === 'normal' ? 'default' : 'outline'} size="sm" onClick={() => onDifficultyChange('normal')}>简单</Button>
              <Button variant={difficulty === 'hard' ? 'destructive' : 'outline'} size="sm" onClick={() => onDifficultyChange('hard')}>困难</Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={onSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}
