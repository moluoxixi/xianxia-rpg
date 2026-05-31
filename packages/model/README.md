# @xianxia-rpg/model

AI 模型配置工具包，负责统一维护模型供应商、默认模型表、默认请求地址和标准 endpoint 拼接规则。

## 责任边界

- 提供 OpenAI 兼容接口和 Anthropic Claude 的默认模型目录。
- 生成前端设置页可编辑的模型表数据。
- 根据供应商规则拼接聊天接口和模型列表接口。
- 不包含 React、Nest、Electron 或数据库依赖。

## URL 约定

- OpenAI 兼容接口的默认 `baseURL` 保留 `/v1`，请求路径拼接 `chat/completions`。
- Anthropic 的默认 `baseURL` 不包含 `/v1`，请求路径由工具包拼接为 `v1/messages`。

