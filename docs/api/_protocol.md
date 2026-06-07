# 外部接口消费协议

## 适用范围

本协议适用于当前项目调用的外部 AI 模型服务和可配置小说搜索服务。当前项目自己提供给前端或其它调用方的 HTTP API 协议维护在 `docs/out-api/_protocol.md`。

## 成功响应

- OpenAI 兼容接口期望返回 `choices[0].message.content`，可选读取 `usage.prompt_tokens`、`usage.completion_tokens`、`usage.total_tokens`。
- Anthropic Messages 接口期望返回 `content` 文本块数组，按 `type === "text"` 拼接回复，可选读取 `usage.input_tokens` 和 `usage.output_tokens`。
- 小说兼容接口期望返回 `{ success, data, message? }`，其中 `data` 是小说摘要数组。
- 自定义小说函数模式由用户脚本把远程响应映射为 `{ novels, message? }`。

## 列表分页

当前消费方协议没有统一分页契约。小说兼容接口只固定向 `/novels/search` POST `keyword`，分页能力为 MISSING。

## 错误响应

- AI 适配器对 HTTP 4xx/5xx 或网络错误返回 `{ success: false, reply: "", error }`。
- 小说服务 HTTP 非 2xx 或 schema 校验失败返回 `{ success: false, data: [], message }`。
- 外部错误暂未映射为稳定错误码。

## 鉴权与 Headers

- OpenAI 兼容接口使用 `Authorization: Bearer <apiKey>`。
- Anthropic 接口使用 `x-api-key: <apiKey>` 与 `anthropic-version: 2023-06-01`。
- 小说兼容接口使用 `Content-Type: application/json`，配置了 `novelApiKey` 时同时发送 `Authorization: Bearer <key>` 与 `X-API-Key: <key>`。

## 版本策略

- AI provider endpoint 由 `@xianxia-rpg/model` 的 provider preset 和用户配置 Base URL 决定。
- Anthropic 版本 Header 固定为 `2023-06-01`。
- 小说兼容接口当前无版本字段。

## 协议偏差

- MISSING：外部服务重试、超时、限流与熔断策略。
- MISSING：外部错误到内部错误码的映射表。

## 待确认

- 是否需要把模型服务和小说服务的外部错误标准化为统一错误码。
- 是否为小说搜索兼容接口增加分页、语言、类型或来源过滤参数。
