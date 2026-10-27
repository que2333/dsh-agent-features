# @local/agent-config

一个最小化的 DSH Responses 配置插件。2.2.1 版本只保留 Responses 原生参数控制和 `none` 模式下的本地显示兼容：

- **推理摘要**：`auto / concise / detailed / none`
- **输出详细程度**：`default / low / medium / high`

插件不会添加提示词、开发指令或额外的过程进度正文，也不会请求第二次模型调用。它只按照本机 Codex 实际发送的 Responses 字段修改最终请求体。

## Responses 原生参数

这两个设置只对 `openai-responses`、`azure-openai-responses` 等 `*-responses` 协议生效。插件直接改写最终请求体：

```json
{
  "reasoning": {
    "effort": "high",
    "summary": "concise"
  },
  "text": {
    "verbosity": "medium"
  }
}
```

- `auto`：写入 `reasoning.summary: "auto"`，与 Codex 的“自动”一致。
- `concise`、`detailed`：写入对应的 `reasoning.summary`。
- `none`：完全省略 `reasoning.summary`，与 Codex 的“无”一致。
- `default`：不发送 `text.verbosity`，使用模型默认值。
- `low`、`medium`、`high`：写入对应的 `text.verbosity`。

摘要和详细程度都随主请求发送，不产生额外模型请求。正文、工具调用、用量和结束原因不会被改写。

部分兼容网关即使没有收到 `reasoning.summary`，仍会返回 `thinking_*` 事件。插件在 `none` 模式下只从本地流、最终消息和 replay 元数据中移除 reasoning block，避免界面继续显示“思考”；这不会改写发往模型的请求，也不会触发额外模型请求。

Chat Completions、Anthropic Messages、Gemini 等协议没有这两个 Responses 原生字段，因此插件不会向这些协议注入参数，也不会尝试用系统提示词模拟它们。

## 自动迁移协议

插件启用后，会把**当前默认 provider** 从 `openai-completions` 自动切换为 `openai-responses`。模型、地址、请求头和凭据保持不变；其他非 OpenAI 兼容协议不会被错误转换。

## 配置重置

2.2.1 继续使用 `summaryLevel` 和 `outputVerbosity` 配置字段。旧版本的 `reasoningSummary`、`verbosity`、`forceResponses` 等值不会再被读取；2.2 中临时的过程进度提示词逻辑已完全删除。

## 开发

```powershell
node --check index.js
node --check client.js
node test-transform.mjs
```
