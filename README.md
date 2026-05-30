# xianxia-rpg

凡人修仙题材的 AI 文字 RPG。当前仓库按“可部署应用”和“可复用库”分层，避免把前端、后端和桌面壳混在同一个 renderer 目录里。

## 目录约定

```text
apps/
  web/        独立 React/Vite 前端应用，可单独发布为网页
  api/        预留 Nest 后端应用位置，用于独立提供 HTTP API
  electron/   预留 Electron 桌面壳位置，负责加载前端和桌面能力

packages/
  shared/     Web、Electron、未来 Nest 共同消费的类型、纯函数和跨端契约
```

`apps/*` 表示最终会被启动、部署或打包的应用；`packages/*` 表示被应用消费的库。  
因此前端不是 `packages/renderer`，而是 `apps/web`：它有自己的 `index.html`、Vite 配置、Tailwind 配置、环境变量和构建产物，本质上是一个正常前端项目。

## 发布形态

- 独立网页：只发布 `apps/web`，通过 `VITE_API_BASE_URL` 连接后端。
- 前后端分离：`apps/web` 和未来的 `apps/api` 分别部署，Web 通过 HTTP client 访问 Nest。
- 桌面应用：Electron shell 在开发时通过 `BrowserWindow.loadURL('http://localhost:5173')` 加载前端；打包后通过 `BrowserWindow.loadFile('dist/web/index.html')` 加载前端产物。
- 桌面 IPC：Electron preload 注入 `window.gameAPI` 后，Web 自动使用 IPC client；没有 IPC 且配置了 `VITE_API_BASE_URL` 时使用 HTTP client。

## 当前脚本

- `npm run dev`：启动 Web 开发服务，并让 Electron 加载该前端链接。
- `npm run dev:web`：只启动独立前端项目。
- `npm run build`：构建 shared、Electron main/preload 和 Web 产物。
- `npm run build:web`：只构建独立网页产物到 `dist/web`。
- `npm run typecheck`：检查 shared、Web 和 Electron 侧 TypeScript。
- `npm run lint`：执行 ESLint。
