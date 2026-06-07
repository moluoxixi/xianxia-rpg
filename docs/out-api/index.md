# 对外 API 文档索引

本目录记录 `@xianxia-rpg/api` 当前向 Web 前端、Electron 壳和外部调用方提供的 HTTP API 契约。接口事实来自 Nest Controller、共享 Host 类型和前端请求客户端。

## 来源快照

| 字段 | 值 |
|---|---|
| sourceCommit | `df3196f31aea8212294778a86eee73795febbfe5` |
| sourceState | dirty: documentation generation changes only; API source files unchanged |
| generatedBy | `api-docs` |
| sourceRoots | `packages/api/src`, `packages/core/src`, `packages/web/src/host` |
| sourceFiles | `packages/api/src/ai.controller.ts`, `packages/api/src/game.controller.ts`, `packages/api/src/novel.controller.ts`, `packages/api/src/game-api.service.ts`, `packages/core/src/host.ts`, `packages/core/src/novel.ts`, `packages/web/src/host/request-client.ts` |

## 接口清单

| 业务域 | 文档 | 接口范围 | 状态 |
|---|---|---|---|
| AI 配置与对话 | [AI配置与对话](AI配置与对话.md) | `/ai/message`、`/ai/config`、`/ai/config/runtime`、`/ai/config/test` | confirmed |
| 游戏存档与场景 | [游戏存档与场景](游戏存档与场景.md) | `/game/save`、`/game/latest`、`/game/load`、`/game/scenario/generate`、`/game/saves`、`/game/delete`、`/game/death-archives`、`/game/inventory-pins` | confirmed |
| 小说检索 | [小说检索](小说检索.md) | `/novels/search` | confirmed |
