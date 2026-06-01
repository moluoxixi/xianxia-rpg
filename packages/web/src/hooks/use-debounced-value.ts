import { useEffect, useState } from 'react';

export function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 输入停顿达到阈值后才发布新值，避免搜索框每次按键都触发远端小说 API。
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debouncedValue;
}
