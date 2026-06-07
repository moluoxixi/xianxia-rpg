# 对外全局接口协议

## 适用范围

本协议适用于 `packages/api` 暴露的 Nest HTTP API。当前服务未设置全局路由前缀，开发环境默认监听 `0.0.0.0:3000`；前端通过 `VITE_API_BASE_URL` 拼接同一组 Host 路径。

## 成功响应

- 现有 Controller 统一返回 JSON，业务结果第一层包含 `success: boolean`。
- 命令型接口通常返回 `message`，查询型接口返回 `data`，AI 对话返回 `reply`。
- `GET /game/latest`、`POST /game/load` 在没有存档时返回 `success: true` 和 `data: null`。
- `POST /game/delete` 删除不存在的存档时返回 HTTP 200、`success: false` 和业务 `message`。

## 列表分页

当前对外 API 没有分页参数。`GET /game/saves` 返回完整存档摘要数组。

| 字段 | 类型 | 说明 |
|---|---|---|
| success | boolean | 请求处理结果 |
| data | array | 存档摘要数组 |

## 错误响应

- 当前项目没有全局 Exception Filter 或统一错误 DTO；未捕获异常由 Nest 默认错误响应处理。
- 前端 `requestHost` 会在非 2xx 时抛出 `HTTP <status>: <body>`，并要求响应 `content-type` 包含 `application/json`。
- 已知业务失败优先体现在 JSON 内的 `success: false`、`message` 或 `error` 字段。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| success | boolean | 是 | 业务层是否成功 |
| message | string | 否 | 面向用户或调用方的业务说明 |
| error | string | 否 | AI 或连接测试失败原因 |

## 鉴权与 Headers

- 对外 API 当前未实现鉴权、租户隔离或 CSRF 策略。
- 服务端启用 CORS `origin: true`。
- POST 请求使用 `Content-Type: application/json`。

## 版本策略

当前 API 无 URL 版本号、Header 版本号或 OpenAPI 版本声明；调用方应按本目录文档和共享 `@xianxia-rpg/core` Host 类型同步升级。

## 协议偏差

- MISSING：没有 DTO ValidationPipe 和字段级校验错误响应契约。
- MISSING：没有统一错误码、traceId 或全局异常映射。
- MISSING：没有公开 OpenAPI/Swagger 文档。

## 待确认

- 是否需要为 Web 部署环境增加 API 前缀、鉴权和错误码体系。
- 是否将 `Record<string, unknown>` 请求体收敛为显式 DTO。
