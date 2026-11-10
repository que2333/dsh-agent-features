# DSH Agent Features

为 DeepSeek Harness 提供已归档聊天管理和消息编辑功能，包含两个可独立启停的组件。

## 安装

### DSH 插件市场

在 DSH 的插件市场设置中添加以下自定义索引：

```text
https://raw.githubusercontent.com/que2333/dsh-agent-features/main/plugin-market.json
```

如果当前网络无法访问 `raw.githubusercontent.com`，可改用 jsDelivr 镜像：

```text
https://cdn.jsdelivr.net/gh/que2333/dsh-agent-features@main/plugin-market.json
```

然后在“发现”中搜索 `Agent功能` 并安装。安装后插件页只显示两个组件，
可分别启停。

### Git 安装

仓库根目录本身就是可直接安装的 DSH bundle：

```text
https://github.com/que2333/dsh-agent-features
```

不需要填写 `&path:` 子目录。市场索引会自动使用与发布版本对应的固定 commit，避免分支
更新造成版本漂移。两个组件作为根包的 `bundleDependencies` 随同一次 Git 安装分发；
不需要手动安装 Git 子目录、GitHub Release 资产或 npm 包。

## 功能

- **已归档的聊天**：在设置中查看已归档会话，支持取消归档、永久删除和全部删除。
- **编辑消息**：编辑用户历史消息，在保留原附件的情况下回退同一会话并重新发送。

## 包结构

| 包 | 作用 |
| --- | --- |
| `@que2333/dsh-agent-features` | 根目录安装入口与 Bundle 清单 |
| `@que2333/dsh-session-delete` | 已归档会话管理 |
| `@que2333/dsh-edit-message` | 用户消息编辑与重发 |

根包的 `cordis.patch.yml` 只挂载两个完整组件包。它们随根包一起分发，并可由 DSH 的
Profile 依赖递归解析，因此宿主与客户端扫描器都能读取其 `dsh.client`。根包自身没有
客户端入口，不会在插件页额外显示根包组件。

## 兼容性

- 插件不会修改模型协议、推理摘要或输出详细程度。
- 两个功能均可在插件页独立启停。

## 开发

需要 Node.js 22+ 和 pnpm 10+。

```powershell
pnpm install
pnpm sync-bundle
pnpm test
```

也可以在仓库根目录分别检查各包：

```powershell
node --check index.js
node --check edit-message/index.js
node --check edit-message/client.js
node --check session-delete/index.js
node --check session-delete/client.js
```

## 目录说明

该仓库既可作为 DSH 本地开发插件的源码目录，也可通过自定义市场安装。通过 `link:` 安装时，源码修改会直接生效；通过 Git 安装后，由 DSH 和 pnpm 锁定版本。
