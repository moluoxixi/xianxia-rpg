# @xianxia-rpg/web

独立的 React 前端项目，可单独作为网页发布，也可被 Electron shell 加载为桌面应用界面。

- Web 发布：`npm run build:web` 产出 `dist/web`
- Electron 开发：根项目通过 `BrowserWindow.loadURL('http://localhost:5173')` 加载本项目
- Electron 打包：根项目通过 `BrowserWindow.loadFile('dist/web/index.html')` 加载本项目
- 后端接入：配置 `VITE_API_BASE_URL` 后可通过 HTTP client 连接 Nest API
- IPC 接入：Electron preload 注入 `window.gameAPI` 时自动使用 IPC client
