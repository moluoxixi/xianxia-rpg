# @xianxia-rpg/web

独立的 React 前端项目，可单独作为网页发布，也可被 Electron shell 加载为桌面应用界面。

- Web 发布：`npm run build:web` 产出 `dist/web`
- Electron 开发：根项目通过 `BrowserWindow.loadURL('http://localhost:5173')` 加载本项目
- Electron 打包：根项目通过 `BrowserWindow.loadFile('dist/web/index.html')` 加载本项目
- 统一请求：业务层使用同一组路径，如 `/game/save`、`/game/latest`、`/ai/config`
- Web 接入：未检测到 Electron preload 时，请求层通过 HTTP 调用同名 API；`VITE_API_BASE_URL` 可指向独立 Nest 服务，未配置时使用同源相对路径
- Electron 接入：检测到 `window.gameAPI` 时，请求层把同名路径映射到 IPC，由主进程写入 SQLite；背包置顶项按当前存档 `runId` 单独归属
