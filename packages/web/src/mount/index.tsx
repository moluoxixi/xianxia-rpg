import type { Root } from 'react-dom/client';
import type { RendererMountOptions } from './types';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';

export function mountRendererApp(container: Element, options: RendererMountOptions = {}): Root {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App hostClient={options.hostClient} />
    </React.StrictMode>,
  );
  return root;
}
