# @xianxia-rpg/web

独立的 React 前端项目，可单独作为网页发布，也可被 Electron shell 加载为桌面应用界面。

- Web 发布：`npm run build:web` 产出 `dist/web`
- 同源部署：根项目 Docker 镜像会让 Nest API 服务 `dist/web`，前端直接请求 `/game/*`、`/ai/*`
- Electron 开发：根项目通过 `BrowserWindow.loadURL('http://127.0.0.1:5173')` 加载本项目
- Electron 打包：根项目启动内置 Nest API 后，通过本地 HTTP 地址加载本项目
- 统一请求：业务层使用同一组路径，如 `/game/save`、`/game/latest`、`/ai/config`
- Web 接入：请求层通过 HTTP 调用同名 API；`VITE_API_BASE_URL` 可指向独立 Nest 服务，未配置时使用同源相对路径
- Electron 接入：桌面壳同样加载 Web 页面并调用 Nest HTTP API，数据由后端按当前存档 `runId` 单独归属

该目录是完整前端项目，不是 Electron renderer 零散源码目录。页面、组件、样式、Vite/Tailwind 配置和 Web 环境变量都在这里闭合。
