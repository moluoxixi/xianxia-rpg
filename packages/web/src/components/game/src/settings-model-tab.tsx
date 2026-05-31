import type { AIModelOption, AIModelProviderType } from '@xianxia-rpg/model';
import type { ReactNode } from 'react';
import type { AIConfigForm } from '@/domain';
import { AI_PROVIDER_PRESETS, createCustomModelRow, getAIProviderPreset, resolveSelectedModelId } from '@xianxia-rpg/model';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';

interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SettingsModelTabProps {
  config: AIConfigForm;
  onConfigChange: (config: AIConfigForm) => void;
}

const providerOptions: SelectOption<AIModelProviderType>[] = Object.values(AI_PROVIDER_PRESETS).map(preset => ({
  label: preset.label,
  value: preset.type,
}));

const maxTokenOptions: SelectOption[] = [
  { label: '1024', value: '1024' },
  { label: '2048', value: '2048' },
  { label: '4096', value: '4096' },
  { label: '8192', value: '8192' },
];

const temperatureOptions: SelectOption[] = [
  { label: '0.3 稳定', value: '0.3' },
  { label: '0.7 平衡', value: '0.7' },
  { label: '1.0 发散', value: '1' },
];

export function SettingsModelTab({ config, onConfigChange }: SettingsModelTabProps) {
  const provider = config.type as AIModelProviderType;
  const modelRows = config.modelCatalog[provider];
  const selectedModel = resolveSelectedModelId(config.model, modelRows);

  function changeProvider(type: AIModelProviderType): void {
    const preset = getAIProviderPreset(type);
    const providerModels = config.modelCatalog[type];
    onConfigChange({
      ...config,
      type,
      baseURL: preset.baseURL,
      model: resolveSelectedModelId(preset.model, providerModels),
      maxTokens: String(preset.maxTokens),
      temperature: String(preset.temperature),
    });
  }

  function changeSelectedModel(model: string): void {
    onConfigChange({ ...config, model });
  }

  function addModelRow(): void {
    const nextRow = createCustomModelRow(provider, modelRows.length + 1);
    const nextRows = [...modelRows, nextRow];
    onConfigChange({
      ...config,
      model: config.model ? config.model : nextRow.id,
      modelCatalog: {
        ...config.modelCatalog,
        [provider]: nextRows,
      },
    });
  }

  function changeModelRow(index: number, patch: Partial<AIModelOption>): void {
    const currentRow = modelRows[index];
    const nextRows = modelRows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row);
    onConfigChange({
      ...config,
      model: currentRow.id === config.model && patch.id ? patch.id : config.model,
      modelCatalog: {
        ...config.modelCatalog,
        [provider]: nextRows,
      },
    });
  }

  function removeModelRow(index: number): void {
    const removedRow = modelRows[index];
    const nextRows = modelRows.filter((_, rowIndex) => rowIndex !== index);
    onConfigChange({
      ...config,
      model: removedRow.id === config.model ? resolveSelectedModelId('', nextRows) : resolveSelectedModelId(config.model, nextRows),
      modelCatalog: {
        ...config.modelCatalog,
        [provider]: nextRows,
      },
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="服务商">
          <Select value={provider} onChange={event => changeProvider(event.target.value as AIModelProviderType)}>
            {providerOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </Field>
        <Field label="调用模型">
          <Select value={selectedModel} onChange={event => changeSelectedModel(event.target.value)} disabled={modelRows.length === 0}>
            {modelRows.map(model => <option key={model.id} value={model.id}>{formatModelOption(model)}</option>)}
          </Select>
        </Field>
        <Field label="请求地址">
          <Input value={config.baseURL} onChange={event => onConfigChange({ ...config, baseURL: event.target.value })} placeholder={getAIProviderPreset(provider).baseURL} />
        </Field>
        <Field label="API Key">
          <Input type="password" value={config.apiKey} onChange={event => onConfigChange({ ...config, apiKey: event.target.value })} placeholder="sk-..." autoComplete="off" />
        </Field>
        <Field label="Max Tokens">
          <Select value={config.maxTokens} onChange={event => onConfigChange({ ...config, maxTokens: event.target.value })}>
            {maxTokenOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </Field>
        <Field label="Temperature">
          <Select value={config.temperature} onChange={event => onConfigChange({ ...config, temperature: event.target.value })}>
            {temperatureOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </Field>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-normal">模型列表</h3>
            <p className="text-xs text-muted-foreground">下拉框只会从当前服务商的模型列表中选择真实调用模型。</p>
          </div>
          <Button type="button" size="sm" color="secondary" onClick={addModelRow}>
            <Plus className="h-4 w-4" />
            新增行
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="w-[44%] px-3 py-2 text-left font-medium">模型 ID</th>
                <th className="w-[44%] px-3 py-2 text-left font-medium">模型名称</th>
                <th className="w-14 px-2 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {modelRows.map((model, index) => (
                <tr key={`${index}:${model.id}`} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Input value={model.id} onChange={event => changeModelRow(index, { id: event.target.value })} placeholder="gpt-5.2" />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={model.name} onChange={event => changeModelRow(index, { name: event.target.value })} placeholder="GPT-5.2" />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Button type="button" size="icon" color="destructive" onClick={() => removeModelRow(index)} aria-label={`删除 ${model.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {modelRows.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">暂无模型，请新增一行。</div> : null}
        </div>
      </section>
    </div>
  );
}

function formatModelOption(model: AIModelOption): string {
  return `${model.name} / ${model.id}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
