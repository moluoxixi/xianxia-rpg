import type { ReactNode } from 'react';
import type { AIConfigForm, NovelApiProvider } from '@/domain';
import { Input, Select, Textarea } from '@/components/ui';
import { defaultNovelApiBuildRequestCode, defaultNovelApiMapResponseCode } from '@/domain';

interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SettingsNovelApiTabProps {
  config: AIConfigForm;
  onConfigChange: (config: AIConfigForm) => void;
}

const novelApiProviderOptions: SelectOption<NovelApiProvider>[] = [
  { label: '暂不启用', value: 'disabled' },
  { label: '兼容协议 Base URL', value: 'compatible' },
  { label: 'Open Library 函数适配', value: 'custom-functions' },
];

const novelFunctionContract = '请求函数返回 { url, method, headers, body }；响应函数返回 { novels: [{ id, title, author, description, source }] }。';

export function SettingsNovelApiTab({ config, onConfigChange }: SettingsNovelApiTabProps) {
  function changeNovelApiProvider(provider: NovelApiProvider): void {
    onConfigChange({
      ...config,
      novelApiProvider: provider,
      novelApiBuildRequestCode: config.novelApiBuildRequestCode || defaultNovelApiBuildRequestCode,
      novelApiMapResponseCode: config.novelApiMapResponseCode || defaultNovelApiMapResponseCode,
    });
  }

  return (
    <div className="grid gap-4">
      <Field label="小说来源">
        <Select value={config.novelApiProvider} onChange={event => changeNovelApiProvider(event.target.value as NovelApiProvider)}>
          {novelApiProviderOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </Field>
      {config.novelApiProvider !== 'disabled'
        ? (
            <>
              <Field label="小说 API Base URL">
                <Input value={config.novelApiBaseURL} onChange={event => onConfigChange({ ...config, novelApiBaseURL: event.target.value })} placeholder="https://example.com/api" />
              </Field>
              <Field label="小说 API Key">
                <Input type="password" value={config.novelApiKey} onChange={event => onConfigChange({ ...config, novelApiKey: event.target.value })} autoComplete="off" />
              </Field>
            </>
          )
        : null}
      {config.novelApiProvider === 'custom-functions'
        ? (
            <div className="grid gap-4">
              <Field label="请求转换函数">
                <Textarea className="min-h-32 font-mono text-xs" value={config.novelApiBuildRequestCode} onChange={event => onConfigChange({ ...config, novelApiBuildRequestCode: event.target.value })} />
              </Field>
              <Field label="响应转换函数">
                <Textarea className="min-h-40 font-mono text-xs" value={config.novelApiMapResponseCode} onChange={event => onConfigChange({ ...config, novelApiMapResponseCode: event.target.value })} />
              </Field>
              <p className="text-xs leading-5 text-muted-foreground">{novelFunctionContract}</p>
            </div>
          )
        : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
