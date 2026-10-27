# Agent功能与配置

`@local/agent-features-config` 是一个 DSH bundle，将以下三个本地插件显示在同一个插件页内，并允许分别启停：

- `@local/agent-config`：Responses 推理摘要与输出详细程度配置，并在启用时把当前默认 OpenAI 兼容 provider 从 Chat Completions 切换到 Responses。
- `@local/session-delete`：设置中的“已归档的聊天”，支持取消归档、删除和全部删除。
- `@local/edit-message`：对话中的用户消息编辑，保留原附件并在同一会话内回退后重发。

这三个组件在插件管理器中各有独立开关。关闭其中一个不会停止另外两个。

组件包同时作为 Desktop Profile 的直接 `link:` 依赖安装，确保 bundle patch
里的模块说明符在运行时可以解析；它们不加入 `dsh.profile.bundles`，因此不会在
插件管理页额外生成卡片。

组件继续使用原路由：

- `POST /edit-message/rewrite`
- `POST /session-delete/delete`

顶层 bundle 的显示名称由 `locale/zh.json` 的 `meta.title` 提供，组件显示名称由各自包的 `locale/zh.json` 提供。

用户消息编辑使用 `conversation.chat.node` 的 `user` key，并以 shadowing priority `-1` 替换内置行，避免与默认注册发生同优先级冲突。

## 开发

```powershell
node --check index.js
node --test test/bundle.test.js
```
