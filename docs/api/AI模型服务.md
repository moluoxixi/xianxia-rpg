# AI 模型服务接口文档

## 来源

- OpenAI 适配器：`packages/api/src/ai/openai-adapter.ts`
- Anthropic 适配器：`packages/api/src/ai/anthropic-adapter.ts`
- Provider preset：`packages/model/src/provider-presets.ts`
- 统一入口：`packages/api/src/ai/index.ts`

## 接口清单

| 方法 | 路径 | 用途 | 状态 |
|---|---|---|---|
| POST | OpenAI Base URL + `chat/completions` | 调用 OpenAI Chat Completions 兼容接口 | confirmed |
| POST | Anthropic Base URL + `v1/messages` | 调用 Anthropic Messages 接口 | confirmed |

## OpenAI 兼容 Chat Completions

### 请求

`POST <baseURL>/chat/completions`

| 名称 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| Authorization | header | string | 是 | `Bearer <apiKey>` |
| Content-Type | header | string | 是 | `application/json` |
| model | body | string | 是 | 模型 ID |
| messages | body | array | 是 | 系统提示词、历史消息和当前用户消息 |
| max_tokens | body | number | 否 | 默认 2048 |
| temperature | body | number | 否 | 默认 0.7 |

### 响应

适配器读取：

```json
{
  "choices": [
    {
      "message": {
        "content": "回复文本"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 1,
    "completion_tokens": 1,
    "total_tokens": 2
  }
}
```

### 错误码

外部服务错误未映射为稳定错误码；HTTP 4xx/5xx 会被包装为错误字符串。

### 联调说明

- 默认 Base URL 为 `https://api.openai.com/v1`。
- 兼容服务可通过设置页或环境变量覆盖 Base URL 与模型。

### 协议偏差

- MISSING：未记录 OpenAI 兼容服务的模型列表刷新接口使用方式。

## Anthropic Messages

### 请求

`POST <baseURL>/v1/messages`

| 名称 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| x-api-key | header | string | 是 | Anthropic API Key |
| anthropic-version | header | string | 是 | 当前固定为 `2023-06-01` |
| Content-Type | header | string | 是 | `application/json` |
| model | body | string | 是 | 模型 ID |
| max_tokens | body | number | 否 | 默认 2048 |
| temperature | body | number | 否 | 默认 0.7 |
| system | body | string | 否 | 系统提示词与历史 system 消息合并结果 |
| messages | body | array | 是 | user/assistant 历史消息和当前用户消息 |

### 响应

适配器读取：

```json
{
  "content": [
    {
      "type": "text",
      "text": "回复文本"
    }
  ],
  "usage": {
    "input_tokens": 1,
    "output_tokens": 1
  }
}
```

### 错误码

外部服务错误未映射为稳定错误码；HTTP 4xx/5xx 会被包装为错误字符串。

### 联调说明

- 默认 Base URL 为 `https://api.anthropic.com`。
- 如果用户把 Base URL 配置为 `https://api.anthropic.com/v1`，模型包会归一化为服务根地址后拼接 `v1/messages`。

### 协议偏差

- MISSING：未记录 Anthropic Bedrock 兼容模式的鉴权差异。

## Mock 与测试数据

- 可通过 `POST /ai/config/test` 间接触发外部模型连接测试。
- MISSING：当前未发现 AI adapter 的外部 HTTP mock 测试。

## 待确认

- 是否需要持久化外部 provider 的错误码、请求 ID 和 token usage。
