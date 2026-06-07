# 外部接口文档索引

本目录只记录当前项目消费的外部服务、第三方 API、上游 SDK 或可配置远程接口；当前项目自己提供的 HTTP API 写入 `docs/out-api/`。

## 来源证据

- `packages/api/src/ai/openai-adapter.ts` 调用 OpenAI Chat Completions 兼容接口。
- `packages/api/src/ai/anthropic-adapter.ts` 调用 Anthropic Messages 接口。
- `packages/api/src/novel-search.ts` 调用可配置小说搜索兼容接口或自定义函数生成的远程请求。

## 外部服务清单

| 外部服务 | 文档 | 接口范围 | 状态 |
|---|---|---|---|
| AI 模型服务 | [AI模型服务](AI模型服务.md) | OpenAI 兼容 Chat Completions、Anthropic Messages | confirmed |
| 小说搜索服务 | [小说搜索服务](小说搜索服务.md) | 兼容 `/novels/search`、自定义 GET/POST 搜索请求 | confirmed |
