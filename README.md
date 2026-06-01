# xianxia-rpg

基于参考小说生成剧本的半开放式 AI 文字 RPG。当前仓库统一按 `packages/*` 管理，避免根目录裸放业务源码，也避免把前端、后端和桌面壳混在同一个 renderer 目录里。

## 目录约定

```text
packages/
  web/        独立 React/Vite 前端项目，可单独发布为网页
  api/        Nest 后端项目，提供同源 HTTP API 并可服务 Web 静态产物
  core/       Web、Electron、Nest 共同消费的类型、纯函数和跨端契约
  model/      可复用 AI 模型配置工具包，提供模型表、供应商默认值和接口 URL 拼接
```

仓库使用 `pnpm-workspace.yaml` 管理 `packages/*`，内部包依赖统一写 `workspace:*`，避免本地 `file:` 依赖和锁文件漂移。

`packages/web` 和 `packages/api` 虽然是可启动、可部署项目，但仍放在 `packages` 下统一管理，方便 workspace、Docker 和发布脚本只认一个物理入口。

前端不是 `packages/renderer`，而是 `packages/web`：它有自己的 `index.html`、Vite 配置、Tailwind 配置、环境变量和构建产物，本质上是一个正常前端项目。

根目录不再保留 `src/`。原先根 `src` 中的 AI 适配器和数据库实现已经归入 `packages/api/src`，因为 Electron 桌面壳也通过同一个 Nest API 访问后端能力。

## 发布形态

- 独立网页：只发布 `packages/web`，通过同源 API 或 `VITE_API_BASE_URL` 连接后端。
- 前后端分离：`packages/web` 和 `packages/api` 分别部署，Web 通过统一请求层访问 Nest HTTP API。
- 单容器 Web：Docker 镜像会构建 `dist/web` 和 Nest API，由 `packages/api` 同源服务网页与 `/game/*`、`/ai/*` 接口。
- 桌面应用：Electron shell 在开发时通过 `BrowserWindow.loadURL('http://127.0.0.1:5173')` 加载前端，并由根级 `npm run dev` 同时启动 Nest API；打包后启动内置 Nest API，并加载该本地后端服务的 Web 页面。
- 统一请求：前端业务层始终请求同一组路径，如 `/game/save`、`/game/latest`、`/ai/config`。配置 `VITE_API_BASE_URL` 时请求独立 Nest HTTP API；未配置时请求同源 HTTP API。
- 数据持久化：Nest API 通过 SQLite 保存游戏存档、死亡归档、AI 配置以及按当前存档 `runId` 归属的背包置顶项；Web 和 Electron 都通过同名 HTTP API 使用这套持久化能力。

## 当前脚本

- `pnpm install`：安装 workspace 依赖并生成统一 `pnpm-lock.yaml`。
- `pnpm run dev`：同时启动 Nest API、Web 开发服务，并让 Electron 加载该前端链接；开发态 Electron 前端通过 `VITE_API_BASE_URL` 调用 Nest。
- `pnpm run dev:api`：启动 Nest API，本地默认监听 `http://127.0.0.1:3000`。
- `pnpm run dev:web`：只启动独立前端项目。
- `pnpm run build`：构建 model、core、Electron main、Web 产物和 Nest API。
- `pnpm run build:model`：构建独立模型配置工具包。
- `pnpm run build:api`：构建 Nest API 到 `dist/api`。
- `pnpm run build:web`：只构建独立网页产物到 `dist/web`。
- `pnpm run start:api`：运行构建后的 Nest API，并在存在 `dist/web` 时同源服务前端。
- `pnpm run typecheck`：检查 model、core、Web、Nest API 和 Electron 侧 TypeScript。
- `pnpm run lint`：执行 ESLint。

## 环境变量

服务端会读取根目录 `.env.local` 和 `.env`，用于给设置页提供默认模型配置；这些值只在 Nest API 侧加载，不会打进 Web bundle。可参考 `.env.example`：

- `XIANXIA_OPENAI_API_KEY`：OpenAI 兼容接口默认 API Key。
- `XIANXIA_OPENAI_BASE_URL`：OpenAI 兼容接口默认请求地址，当前本地默认配置为 `https://coderelay.cn/v1`。
- `XIANXIA_ANTHROPIC_API_KEY`：Anthropic Claude 默认 API Key。
- `XIANXIA_ANTHROPIC_BASE_URL`：Anthropic Claude 默认请求地址，当前本地默认配置为 `https://coderelay.cn`。
- `XIANXIA_DATA_DIR`：Nest API 的 SQLite 数据目录，默认写入项目根目录下的 `data`。

## Docker 快速部署

```bash
docker compose up --build
```

默认 `Dockerfile` 是单容器整站部署：构建 `dist/web` 和 Nest API，由 API 同源服务网页与 `/game/*`、`/ai/*`、`/novels/*`。启动后访问 `http://localhost:3000`。容器会把 SQLite 数据写入 `xianxia-data` volume，对应容器内路径 `/data`，也可以通过 `XIANXIA_DATA_DIR` 改写数据目录。

前后端分离部署使用独立 Dockerfile：

```bash
docker compose -f docker-compose.split.yml up --build
```

- `packages/api/Dockerfile`：只发布 Nest API，监听 `3000`，负责数据库和 AI/小说接口。
- `packages/web/Dockerfile`：只发布静态 Web 页面，由 Nginx 服务 `dist/web`，通过构建参数 `VITE_API_BASE_URL` 指向后端 API。
- `docker-compose.split.yml`：本地默认把 Web 暴露到 `http://localhost:5173`，API 暴露到 `http://localhost:3000`。

Electron 打包不走前端或后端的独立 Docker 镜像。桌面形态仍使用根级 `pnpm run build` 产出 Web、API 和 main 代码，Electron 启动内置 Nest API 并加载本地服务页面；后续如果引入 `electron-builder`，应单独建立桌面打包流水线。
