# AI 配置与对话接口文档

## 来源

- Controller：`packages/api/src/ai.controller.ts`
- Service：`packages/api/src/game-api.service.ts`
- 类型：`packages/core/src/host.ts`、`packages/core/src/ai.ts`
- 前端调用：`packages/web/src/host/request-client.ts`

## 接口清单

| 方法 | 路径 | 用途 | 状态 |
|---|---|---|---|
| POST | `/ai/message` | 发送玩家输入并获取 AI 回复 | confirmed |
| POST | `/ai/config/runtime` | 更新当前运行时 AI 配置，不持久化 | confirmed |
| POST | `/ai/config` | 保存 AI 配置到本地数据库 | confirmed |
| GET | `/ai/config` | 读取持久化 AI 配置和小说来源配置 | confirmed |
| POST | `/ai/config/test` | 用给定配置测试 AI 连接 | confirmed |

## 发送 AI 消息

### 请求

`POST /ai/message`

| 名称 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| message | body | string | 是 | 本次玩家输入 |
| history | body | array | 是 | 历史消息数组，元素包含 `role` 与 `content` |

### 响应

```json
{
  "success": true,
  "reply": "山风卷过石阶，你听见洞府深处传来回声。"
}
```

失败时返回：

```json
{
  "success": false,
  "reply": "",
  "error": "连接失败原因"
}
```

### 错误码

当前接口没有稳定错误码；AI 适配器失败通过 `error` 字段返回。

### 联调说明

- 未配置 API Key 或 API Key 仍为占位值时，服务端返回 `success: true` 和占位回复。
- `history` 中的角色会映射到 OpenAI/Anthropic 适配器支持的消息角色。

## 更新运行时 AI 配置

### 请求

`POST /ai/config/runtime`

请求体类型为 `HostSettingsPayload`，当前源码定义为 `Record<string, unknown>`。

| 名称 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| type | body | `openai` 或 `anthropic` | 否 | 当前 AI provider |
| baseURL | body | string | 否 | 当前 provider Base URL |
| apiKey | body | string | 否 | 当前 provider API Key |
| model | body | string | 否 | 模型 ID |
| providerApiKeys | body | object | 否 | 分 provider API Key |
| providerBaseURLs | body | object | 否 | 分 provider Base URL |

### 响应

```json
{
  "success": true,
  "message": "AI 配置已更新: openai / gpt-5.2"
}
```

### 错误码

MISSING：当前没有字段级校验与稳定错误码。

### 联调说明

- 该接口只修改内存中的运行时配置。
- provider 切换时会按 provider 保存独立 API Key 与 Base URL。

## 保存 AI 配置

### 请求

`POST /ai/config`

请求体同 `POST /ai/config/runtime`，并可包含小说来源配置字段：`novelApiProvider`、`novelApiBaseURL`、`novelApiKey`、`novelApiBuildRequestCode`、`novelApiMapResponseCode`。

### 响应

```json
{
  "success": true,
  "message": "AI 配置已保存"
}
```

### 错误码

MISSING：当前没有字段级校验与稳定错误码。

### 联调说明

- 配置持久化到本地 SQLite `app_settings` 的 `ai-config` 记录。
- 保存后运行时配置同步更新。

## 读取 AI 配置

### 请求

`GET /ai/config`

### 参数

无。

### 响应

```json
{
  "success": true,
  "data": {
    "type": "openai",
    "baseURL": "https://api.openai.com/v1",
    "apiKey": "",
    "model": "gpt-5.2",
    "maxTokens": 2048,
    "temperature": 0.7,
    "novelApiProvider": "ai"
  }
}
```

### 错误码

MISSING：当前没有字段级校验与稳定错误码。

### 联调说明

- 返回体会合并默认 AI 配置与已持久化配置。
- `data` 内包含可供设置页编辑的小说来源配置。

## 测试 AI 连接

### 请求

`POST /ai/config/test`

| 名称 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| type | body | `openai` 或 `anthropic` | 否 | 缺省按 `openai` |
| baseURL | body | string | 否 | 测试用 Base URL |
| apiKey | body | string | 否 | 测试用 API Key |
| model | body | string | 否 | 测试用模型 |

### 响应

```json
{
  "success": true,
  "reply": "连接成功"
}
```

失败时返回：

```json
{
  "success": false,
  "error": "HTTP 401: ..."
}
```

### 错误码

当前接口没有稳定错误码；失败原因通过 `error` 返回。

### 联调说明

- 服务端使用固定测试提示词，请求最大 token 为 64、temperature 为 0。
- 请求失败不会抛出业务异常，而是包装为 JSON 失败响应。

## Mock 与测试数据

- MISSING：当前未发现覆盖这些 Controller 的接口测试。
- 可使用假的 `apiKey` 触发占位回复路径验证 `/ai/message`。

## 待确认

- 是否将 `HostSettingsPayload` 从开放记录类型收敛为 DTO。
- 是否统一 AI 配置字段的脱敏返回策略。
