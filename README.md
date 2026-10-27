# DSH Agent Features

为 DeepSeek Harness 提供接近 Codex 的 Agent 功能与配置，由一个管理入口和三个可独立启停的组件组成。

## 功能

- **推理摘要与输出**：对 Responses 协议设置原生 `reasoning.summary` 和 `text.verbosity`，不追加提示词，也不额外请求主模型。插件启用时会把兼容的 OpenAI Chat Completions Provider 切换为 Responses。
- **已归档的聊天**：在设置中查看已归档会话，支持取消归档、永久删除和全部删除。
- **编辑消息**：编辑用户历史消息，在保留原附件的情况下回退同一会话并重新发送。

## 包结构

| 包 | 作用 |
| --- | --- |
| `agent-features-config` | 统一插件入口与“Agent功能与配置”页面 |
| `agent-config` | Responses 推理摘要与输出详细程度 |
| `session-delete` | 已归档会话管理 |
| `edit-message` | 用户消息编辑与重发 |

`agent-features-config` 通过 `cordis.patch.yml` 挂载另外三个组件；每个组件保留独立开关。

## 兼容性

- 推理摘要与输出详细程度仅对 Responses 协议生效。
- Chat Completions、Anthropic 等协议不会收到 `reasoning.summary` 或 `text.verbosity`。
- 插件不会为了生成摘要额外调用主模型。

## 开发

需要 Node.js 22+ 和 pnpm 10+。

```powershell
pnpm install
pnpm test
```

也可以在仓库根目录分别检查各包：

```powershell
node --check agent-config/index.js
node --check agent-config/client.js
node --check agent-features-config/index.js
node --check agent-features-config/client.js
node --check edit-message/index.js
node --check edit-message/client.js
node --check session-delete/index.js
node --check session-delete/client.js
```

## 目录说明

该仓库既可作为 DSH 本地开发插件的源码目录，也可作为后续发布到插件市场的基础。通过 `link:` 安装时，源码修改会直接生效；发布为带版本号的包后，可由包管理器锁定、升级和卸载。
