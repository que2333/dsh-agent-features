# DSH Agent Features

为 DeepSeek Harness 提供接近 Codex 的 Agent 功能与配置，由一个管理入口和三个可独立启停的组件组成。

## 安装

### DSH 插件市场

在 DSH 的插件市场设置中添加以下自定义索引：

```text
https://raw.githubusercontent.com/que2333/dsh-agent-features/main/plugin-market.json
```

然后在“发现”中搜索 `Agent功能与配置` 并安装。安装后可在插件页分别启停三个组件。

### Git 安装

仓库同时可作为 DSH 的 Git 子目录包安装：

```text
git+https://github.com/que2333/dsh-agent-features.git#<commit>&path:/agent-features-config
```

市场索引会自动使用与发布版本对应的固定 commit，避免分支更新造成版本漂移。三个组件包放在
仓库的 `dist/`，总包通过固定 tag 的 Raw URL 安装，不依赖 GitHub Release 资产。

## 功能

- **推理摘要与输出**：对 Responses 协议设置原生 `reasoning.summary` 和 `text.verbosity`，不追加提示词，也不额外请求主模型。插件启用时会把兼容的 OpenAI Chat Completions Provider 切换为 Responses。
- **已归档的聊天**：在设置中查看已归档会话，支持取消归档、永久删除和全部删除。
- **编辑消息**：编辑用户历史消息，在保留原附件的情况下回退同一会话并重新发送。

## 包结构

| 包 | 作用 |
| --- | --- |
| `@que2333/dsh-agent-features` | 统一插件入口与“Agent功能与配置”页面 |
| `@que2333/dsh-agent-config` | Responses 推理摘要与输出详细程度 |
| `@que2333/dsh-session-delete` | 已归档会话管理 |
| `@que2333/dsh-edit-message` | 用户消息编辑与重发 |

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

该仓库既可作为 DSH 本地开发插件的源码目录，也可通过自定义市场安装。通过 `link:` 安装时，源码修改会直接生效；通过 Git 安装后，由 DSH 和 pnpm 锁定版本。
