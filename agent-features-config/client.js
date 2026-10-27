window.__ModuleLoader__.load({
  id: '@local/agent-features-config',
  factory(require) {
    const agentConfig = createAgentConfigClient(require)
    const sessionDelete = createSessionDeleteClient(require)
    const editMessage = createEditMessageClient(require)

    return {
      inject: ['slots', 'locale', 'configForms', 'sessions', 'uiWorkspace'],
      apply(ctx) {
        agentConfig.apply(ctx)
        sessionDelete.apply(ctx)
        editMessage.apply(ctx)
      },
    }
  },
})

function createAgentConfigClient(require) {
    const React = require('react')
    const { createPortal } = require('react-dom')
    const h = React.createElement
    const NS = 'agent-config'
    const ENTRY_ID = 'agent-config'

    /** Simplified Chinese dictionary (key-set source of truth). */
    const zh = {
      'nav.config': 'Agent功能与配置',
      'page.title': 'Agent功能与配置',
      'page.subtitle': '配置 Responses 原生推理摘要和输出详细程度',
      'section.defaults': 'Responses 原生参数',
      'reasoning.label': '推理摘要',
      'reasoning.description': '控制 reasoning.summary，与 Codex 的推理摘要设置一致',
      'reasoning.auto': '自动',
      'reasoning.auto.description': '发送 summary: auto，由模型选择摘要详细程度',
      'reasoning.concise': '简洁',
      'reasoning.concise.description': '使用简洁的思考摘要',
      'reasoning.detailed': '详细',
      'reasoning.detailed.description': '使用详细的思考摘要',
      'reasoning.none': '无',
      'reasoning.none.description': '不发送 reasoning.summary，关闭思考摘要',
      'verbosity.label': '输出详细程度',
      'verbosity.description': '直接设置 text.verbosity',
      'verbosity.default': '模型默认',
      'verbosity.default.description': '不发送 text.verbosity，使用模型默认值',
      'verbosity.low': '低',
      'verbosity.low.description': '保持回复简洁',
      'verbosity.medium': '中',
      'verbosity.medium.description': '兼顾细节与简洁',
      'verbosity.high': '高',
      'verbosity.high.description': '在回复中包含更多细节',
      'page.nativeNote': '仅对 Responses 协议生效；Chat Completions、Anthropic 等协议不会注入这些参数。不会添加提示词或额外模型请求。选择“无”时不发送 reasoning.summary；若兼容网关仍返回思考事件，插件只在本地隐藏。插件启用时会把当前 OpenAI Completions provider 自动切换为 Responses。',
      'status.saving': '保存中…',
      'loading': '加载中…',
      'error.save': '保存失败，请重试。',
      'error.unavailable': '配置暂不可用，请重启应用后重试。',
      'error.page': '配置页面加载失败，请刷新后重试。',
    }
    /** English dictionary, checked complete against the zh key set. */
    const en = {
      'nav.config': 'Agent Features & Configuration',
      'page.title': 'Agent Features & Configuration',
      'page.subtitle': 'Configure native Responses reasoning summary and output verbosity',
      'section.defaults': 'Native Responses options',
      'reasoning.label': 'Reasoning summary',
      'reasoning.description': 'Set reasoning.summary with the same values Codex uses',
      'reasoning.auto': 'Auto',
      'reasoning.auto.description': 'Send summary: auto and let the model choose summary detail',
      'reasoning.concise': 'Concise',
      'reasoning.concise.description': 'Use concise reasoning summaries',
      'reasoning.detailed': 'Detailed',
      'reasoning.detailed.description': 'Use detailed reasoning summaries',
      'reasoning.none': 'None',
      'reasoning.none.description': 'Omit reasoning.summary and disable summaries',
      'verbosity.label': 'Output verbosity',
      'verbosity.description': 'Set text.verbosity directly',
      'verbosity.default': 'Model default',
      'verbosity.default.description': 'Omit text.verbosity and use the model default',
      'verbosity.low': 'Low',
      'verbosity.low.description': 'Keep replies concise',
      'verbosity.medium': 'Medium',
      'verbosity.medium.description': 'Balance detail and brevity',
      'verbosity.high': 'High',
      'verbosity.high.description': 'Include more detail in replies',
      'page.nativeNote': 'Applies only to Responses protocols. Chat Completions, Anthropic, and other protocols receive no injected options. No prompts or extra model requests are added. None omits reasoning.summary; if a compatible gateway still returns thinking events, they are hidden locally. The current OpenAI Completions provider is switched to Responses when the plugin is enabled.',
      'status.saving': 'Saving…',
      'loading': 'Loading…',
      'error.save': 'Could not save. Try again.',
      'error.unavailable': 'Configuration is unavailable. Restart the app and try again.',
      'error.page': 'The configuration page failed to load. Refresh and try again.',
    }

    const REASONING_VALUES = ['auto', 'concise', 'detailed', 'none']
    const VERBOSITY_VALUES = ['default', 'low', 'medium', 'high']
    const MENU_MIN_WIDTH = 260
    const MENU_MAX_WIDTH = 340

    const STYLE_TAG = '@local/agent-config/AgentConfig.css'
    const CSS = `
.dscfg-page{display:flex;flex-direction:column;gap:22px;width:100%;padding-top:8px;color:var(--dsw-alias-label-primary);font-size:13px}
.dscfg-header{display:flex;flex-direction:column;gap:6px}
.dscfg-title{margin:0;font-size:22px;line-height:28px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dscfg-subtitle{margin:0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.dscfg-section{display:flex;flex-direction:column;gap:10px}
.dscfg-section-title{margin:0;padding:0 2px;font-size:13px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-primary)}
.dscfg-card{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-layer-1);overflow:visible}
.dscfg-row{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:64px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dscfg-row:last-child{border-bottom:none}
.dscfg-row-copy{display:flex;flex-direction:column;gap:3px;min-width:0}
.dscfg-row-label{font-size:13px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-primary)}
.dscfg-row-description{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.dscfg-control{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none}
.dscfg-select{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:space-between;gap:8px;min-width:92px;height:32px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:18px;cursor:pointer;transition:background .1s,border-color .1s}
.dscfg-select:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dscfg-select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dscfg-select:disabled{opacity:.55;cursor:default}
.dscfg-select svg{width:12px;height:12px;flex:none;color:var(--dsw-alias-label-tertiary)}
.dscfg-saving{font-size:11px;line-height:14px;color:var(--dsw-alias-label-tertiary)}
.dscfg-menu{position:fixed;z-index:1100;box-sizing:border-box;padding:6px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-overlay);box-shadow:0 16px 40px rgba(0,0,0,.18);max-height:min(420px,calc(100vh - 16px));overflow:auto;outline:none}
.dscfg-option{box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;width:100%;padding:8px 10px;border:none;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-primary);font-family:inherit;text-align:left;cursor:pointer;outline:none}
.dscfg-option:hover,.dscfg-option:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
.dscfg-option-copy{display:flex;flex-direction:column;gap:2px;min-width:0}
.dscfg-option-title{font-size:13px;line-height:18px;font-weight:500}
.dscfg-option-description{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.dscfg-option-check{width:16px;height:16px;flex:none;margin-top:1px;color:var(--dsw-alias-label-primary)}
.dscfg-error{padding:9px 12px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:16px}
.dscfg-status{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
@media (max-width:520px){
  .dscfg-row{flex-direction:column;align-items:stretch;gap:10px}
  .dscfg-control{align-items:stretch}
  .dscfg-select{width:100%}
}
`

    function insertStyle() {
      if (typeof document === 'undefined') return () => {}
      const selector = `style[data-plugin-css=${JSON.stringify(STYLE_TAG)}]`
      const existing = document.querySelector(selector)
      if (existing !== null) return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = '@local/agent-config'
      tag.dataset.pluginCss = STYLE_TAG
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => {
        tag.remove()
      }
    }

    function ChevronIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M4 6l4 4 4-4' }),
      )
    }

    function CheckIcon() {
      return h(
        'svg',
        {
          className: 'dscfg-option-check',
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M3.2 8.3l3 3 6.6-6.8' }),
      )
    }

    function optionValue(value, allowed, fallback) {
      return typeof value === 'string' && allowed.includes(value) ? value : fallback
    }

    function menuWidth() {
      return Math.max(MENU_MIN_WIDTH, Math.min(MENU_MAX_WIDTH, window.innerWidth - 16))
    }

    function menuPosition(rect, width, height) {
      const margin = 8
      let left = rect.right - width
      left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - width - margin))
      let top = rect.bottom + 6
      if (top + height > window.innerHeight - margin) {
        const above = rect.top - 6 - height
        top = above >= margin ? above : Math.max(margin, window.innerHeight - margin - height)
      }
      return { top, left, width }
    }

    function useFormSnapshot(form) {
      const subscribe = React.useCallback((listener) => form.subscribe(listener), [form])
      const getSnapshot = React.useCallback(() => form.getSnapshot(), [form])
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    }

    function Dropdown({ t, label, options, value, disabled, pending, onSelect }) {
      const [open, setOpen] = React.useState(false)
      const [position, setPosition] = React.useState(null)
      const buttonRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const menuId = React.useId()
      const selected = options.find((option) => option.value === value) ?? options[0]

      const compute = React.useCallback(
        (height) => {
          const button = buttonRef.current
          if (button === null) return null
          const rect = button.getBoundingClientRect()
          return menuPosition(rect, menuWidth(), height > 0 ? height : options.length * 56 + 12)
        },
        [options.length],
      )

      const openMenu = React.useCallback(() => {
        if (disabled) return
        const next = compute(0)
        if (next === null) return
        setPosition(next)
        setOpen(true)
      }, [compute, disabled])

      React.useLayoutEffect(() => {
        if (!open) return
        const menu = menuRef.current
        if (menu === null) return
        const next = compute(menu.offsetHeight)
        if (next === null) return
        setPosition((current) =>
          current !== null && current.top === next.top && current.left === next.left && current.width === next.width
            ? current
            : next,
        )
      }, [open, compute])

      React.useEffect(() => {
        if (!open) return
        const onPointerDown = (event) => {
          if (menuRef.current?.contains(event.target)) return
          if (buttonRef.current?.contains(event.target)) return
          setOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          setOpen(false)
          buttonRef.current?.focus()
        }
        const onResize = () => setOpen(false)
        const onScroll = (event) => {
          if (menuRef.current !== null && event.target instanceof Node && menuRef.current.contains(event.target)) return
          setOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown)
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onScroll, true)
        return () => {
          document.removeEventListener('mousedown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('resize', onResize)
          window.removeEventListener('scroll', onScroll, true)
        }
      }, [open])

      React.useEffect(() => {
        if (!open) return
        const menu = menuRef.current
        if (menu === null) return
        const target = menu.querySelector('[data-selected="true"]') ?? menu.querySelector('[data-option]')
        if (target !== null && typeof target.focus === 'function') target.focus()
      }, [open])

      const onMenuKeyDown = (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return
        const menu = menuRef.current
        if (menu === null) return
        const items = Array.from(menu.querySelectorAll('[data-option]'))
        if (items.length === 0) return
        event.preventDefault()
        const current = items.indexOf(document.activeElement)
        let next = 0
        if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length
        else if (event.key === 'ArrowUp') next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length
        else if (event.key === 'End') next = items.length - 1
        items[next]?.focus()
      }

      const choose = (next) => {
        setOpen(false)
        buttonRef.current?.focus()
        if (next !== value) onSelect(next)
      }

      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            ref: buttonRef,
            type: 'button',
            className: 'dscfg-select',
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            'aria-controls': open ? menuId : undefined,
            'aria-label': label,
            disabled,
            onClick: () => {
              if (open) setOpen(false)
              else openMenu()
            },
            onKeyDown: (event) => {
              if (event.key === 'ArrowDown' && !open) {
                event.preventDefault()
                openMenu()
              }
            },
          },
          h('span', null, selected === undefined ? '' : selected.label),
          h(ChevronIcon),
        ),
        open && position !== null
          ? createPortal(
              h(
                'div',
                {
                  ref: menuRef,
                  id: menuId,
                  className: 'dscfg-menu',
                  role: 'listbox',
                  tabIndex: -1,
                  'aria-label': label,
                  style: { top: position.top, left: position.left, width: position.width },
                  onKeyDown: onMenuKeyDown,
                },
                options.map((option) =>
                  h(
                    'div',
                    {
                      key: option.value,
                      role: 'option',
                      'aria-selected': option.value === value,
                      'data-option': '',
                      'data-selected': option.value === value ? 'true' : undefined,
                      tabIndex: -1,
                      className: 'dscfg-option',
                      onClick: () => choose(option.value),
                      onKeyDown: (event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        choose(option.value)
                      },
                    },
                    h(
                      'span',
                      { className: 'dscfg-option-copy' },
                      h('span', { className: 'dscfg-option-title' }, option.label),
                      h('span', { className: 'dscfg-option-description' }, option.description),
                    ),
                    option.value === value ? h(CheckIcon) : null,
                  ),
                ),
              ),
              document.body,
            )
          : null,
      )
    }

    function SettingRow({ t, label, description, options, value, disabled, pending, onSelect }) {
      return h(
        'div',
        { className: 'dscfg-row' },
        h(
          'div',
          { className: 'dscfg-row-copy' },
          h('div', { className: 'dscfg-row-label' }, label),
          h('div', { className: 'dscfg-row-description' }, description),
        ),
        h(
          'div',
          { className: 'dscfg-control' },
          h(Dropdown, {
            t,
            label,
            options,
            value,
            disabled,
            pending,
            onSelect,
          }),
          pending ? h('span', { className: 'dscfg-saving' }, t('status.saving')) : null,
        ),
      )
    }

    function ConfigurationPage({ t, form }) {
      const snapshot = useFormSnapshot(form)
      const ready = snapshot.status === 'ready'
      const unavailable = snapshot.status === 'unavailable'
      const writable = ready && snapshot.writable !== false
      const stored = snapshot.value !== null && typeof snapshot.value === 'object' ? snapshot.value : {}
      const reasoning = optionValue(stored.summaryLevel, REASONING_VALUES, 'auto')
      const verbosity = optionValue(stored.outputVerbosity, VERBOSITY_VALUES, 'default')
      const [pending, setPending] = React.useState(null)
      const [error, setError] = React.useState(null)

      const choose = React.useCallback(
        async (field, next) => {
          if (pending !== null) return
          setPending(field)
          setError(null)
          try {
            const accepted = await form.set(field, next)
            if (!accepted) setError(t('error.save'))
          } catch (failure) {
            console.error('[agent-config] could not save the preference:', failure)
            setError(t('error.save'))
          } finally {
            setPending(null)
          }
        },
        [form, pending, t],
      )

      const reasoningOptions = REASONING_VALUES.map((value) => ({
        value,
        label: t(`reasoning.${value}`),
        description: t(`reasoning.${value}.description`),
      }))
      const verbosityOptions = VERBOSITY_VALUES.map((value) => ({
        value,
        label: t(`verbosity.${value}`),
        description: t(`verbosity.${value}.description`),
      }))

      return h(
        'div',
        { className: 'dscfg-page' },
        h(
          'div',
          { className: 'dscfg-header' },
          h('h1', { className: 'dscfg-title' }, t('page.title')),
          h('p', { className: 'dscfg-subtitle' }, t('page.subtitle')),
        ),
        h(
          'section',
          { className: 'dscfg-section' },
          h('h2', { className: 'dscfg-section-title' }, t('section.defaults')),
          h(
            'div',
            { className: 'dscfg-card' },
            h(SettingRow, {
              t,
              label: t('reasoning.label'),
              description: t('reasoning.description'),
              options: reasoningOptions,
              value: reasoning,
              disabled: !writable || pending !== null,
              pending: pending === 'summaryLevel',
              onSelect: (next) => choose('summaryLevel', next),
            }),
            h(SettingRow, {
              t,
              label: t('verbosity.label'),
              description: t('verbosity.description'),
              options: verbosityOptions,
              value: verbosity,
              disabled: !writable || pending !== null,
              pending: pending === 'outputVerbosity',
              onSelect: (next) => choose('outputVerbosity', next),
            }),
          ),
        ),
        h('p', { className: 'dscfg-status' }, t('page.nativeNote')),
        error !== null || unavailable
          ? h('div', { className: 'dscfg-error', role: 'alert' }, error ?? t('error.unavailable'))
          : null,
        !ready && !unavailable ? h('div', { className: 'dscfg-status' }, t('loading')) : null,
      )
    }

    class PageBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      componentDidCatch(error) {
        console.error('[agent-config] settings page failed:', error)
      }

      render() {
        if (this.state.failed) {
          return h('div', { className: 'dscfg-error', role: 'alert' }, this.props.fallback)
        }
        return this.props.children
      }
    }

    function GuardedPage(props) {
      return h(PageBoundary, { fallback: props.t('error.page') }, h(ConfigurationPage, props))
    }

    return {
      inject: ['slots', 'locale', 'configForms'],
      apply(ctx) {
        ctx.effect(insertStyle, 'agent-config: page styles')
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'agent-config: dictionaries')
        const t = ctx.locale.bind(NS)
        const form = ctx.configForms.get(ENTRY_ID)

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'agent-config',
              order: 18,
              locale: NS,
              label: () => t('nav.config'),
              inject: () => ({ form }),
            },
            GuardedPage,
          ),
        )
      },
    }
}

function createSessionDeleteClient(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'session-delete'
    const ROUTE = '/session-delete/delete'

    /** Simplified Chinese dictionary (key-set source of truth). */
    const zh = {
      'nav.archived': '已归档的聊天',
      'page.title': '已归档的聊天',
      'page.subtitle': '{count} 个已归档会话',
      'deleteAll': '全部删除',
      'search.placeholder': '搜索已归档的聊天',
      'filter.all': '全部项目',
      'group.ungrouped': '未分组',
      'group.count': '{count} 个聊天',
      'unarchive': '取消归档',
      'delete': '删除',
      'cancel': '取消',
      'deleting': '删除中…',
      'confirm.row': '删除？',
      'confirm.all': '删除全部 {count} 个已归档会话？此操作无法恢复。',
      'empty.none': '没有已归档的聊天',
      'empty.filter': '没有匹配的已归档聊天',
      'untitled': '未命名会话',
      'notice.skipped': '已删除 {removed} 个；{skipped} 个未能关闭或删除。',
      'error.active': '该会话正在使用，暂时无法关闭。请稍后重试。',
      'error.notArchived': '只能删除已归档的会话。',
      'error.forbidden': '删除请求被拒绝，请重试。',
      'error.failed': '删除失败，请重试。',
    }
    /** English dictionary, checked complete against the zh key set. */
    const en = {
      'nav.archived': 'Archived chats',
      'page.title': 'Archived chats',
      'page.subtitle': '{count} archived chats',
      'deleteAll': 'Delete all',
      'search.placeholder': 'Search archived chats',
      'filter.all': 'All projects',
      'group.ungrouped': 'Ungrouped',
      'group.count': '{count} chats',
      'unarchive': 'Unarchive',
      'delete': 'Delete',
      'cancel': 'Cancel',
      'deleting': 'Deleting…',
      'confirm.row': 'Delete?',
      'confirm.all': 'Delete all {count} archived chats? This cannot be undone.',
      'empty.none': 'No archived chats',
      'empty.filter': 'No archived chats match',
      'untitled': 'Untitled chat',
      'notice.skipped': 'Deleted {removed}; {skipped} could not be closed or deleted.',
      'error.active': 'The chat is in use and could not be closed. Try again shortly.',
      'error.notArchived': 'Only archived chats can be deleted.',
      'error.forbidden': 'The delete request was rejected. Try again.',
      'error.failed': 'Delete failed. Try again.',
    }

    const STYLE_TAG = '@local/session-delete/ArchivedChats.css'
    const CSS = `
.dsdel-page{display:flex;flex-direction:column;gap:16px;width:100%;padding-top:8px;font-size:13px;color:var(--dsw-alias-label-primary)}
.dsdel-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.dsdel-heading{min-width:0}
.dsdel-title{margin:0;font-size:22px;line-height:28px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dsdel-subtitle{margin:4px 0 0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.dsdel-danger-button{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;flex:none;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-state-error-primary);font-family:inherit;font-size:13px;cursor:pointer;transition:background .1s,color .1s}
.dsdel-danger-button:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-base)}
.dsdel-danger-button:disabled{opacity:.45;cursor:default}
.dsdel-danger-button svg{width:14px;height:14px;display:block}
.dsdel-toolbar{display:flex;align-items:center;gap:8px}
.dsdel-search{position:relative;flex:1;min-width:0;display:flex;align-items:center}
.dsdel-search svg{position:absolute;left:10px;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);pointer-events:none}
.dsdel-input{box-sizing:border-box;width:100%;height:36px;padding:0 12px 0 32px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;outline:none}
.dsdel-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.dsdel-input:focus{border-color:var(--dsw-alias-brand-primary)}
.dsdel-filter{position:relative;flex:none;width:150px}
.dsdel-filter-button{box-sizing:border-box;width:100%;height:36px;padding:0 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:13px;cursor:pointer}
.dsdel-filter-button:hover{color:var(--dsw-alias-label-primary)}
.dsdel-filter-button span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsdel-filter-button svg{width:12px;height:12px;flex:none}
.dsdel-filter-menu{position:absolute;top:calc(100% + 4px);right:0;z-index:30;min-width:180px;max-height:240px;overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-overlay);box-shadow:0 12px 32px rgba(0,0,0,.35)}
.dsdel-filter-option{display:block;width:100%;padding:7px 8px;border:none;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:13px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.dsdel-filter-option:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsdel-filter-option[data-selected=true]{color:var(--dsw-alias-label-primary);font-weight:500}
.dsdel-banner{padding:10px 12px;border-radius:var(--dsw-radius-sm);font-size:13px;line-height:18px}
.dsdel-banner.error{color:var(--dsw-alias-state-error-primary);border:1px solid var(--dsw-alias-state-error-primary)}
.dsdel-banner.notice{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.dsdel-confirm-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-sm)}
.dsdel-confirm-text{min-width:0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary)}
.dsdel-confirm-actions{display:flex;gap:8px;flex:none}
.dsdel-button{height:28px;padding:0 12px;border:1px solid transparent;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer}
.dsdel-button:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.dsdel-button.danger{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-base);font-weight:500}
.dsdel-button:disabled{opacity:.5;cursor:default}
.dsdel-group{display:flex;flex-direction:column;gap:8px}
.dsdel-group-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 2px}
.dsdel-group-title{display:flex;align-items:center;gap:8px;min-width:0;font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}
.dsdel-group-title svg{width:15px;height:15px;flex:none;color:var(--dsw-alias-label-tertiary)}
.dsdel-group-title span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsdel-group-count{flex:none;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.dsdel-list{border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-xl);overflow:hidden;background:var(--dsw-alias-bg-layer-1)}
.dsdel-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.dsdel-row:last-child{border-bottom:none}
.dsdel-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.dsdel-row-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary)}
.dsdel-row-date{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.dsdel-row-actions{display:flex;align-items:center;gap:4px;flex:none}
.dsdel-icon-button{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:none;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dsdel-icon-button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-state-error-primary)}
.dsdel-icon-button svg{width:15px;height:15px;display:block}
.dsdel-unarchive{height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dsdel-unarchive:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsdel-unarchive:disabled{opacity:.5;cursor:default}
.dsdel-row-confirm{display:flex;align-items:center;gap:6px;flex:none}
.dsdel-row-confirm span{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dsdel-mini{height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dsdel-mini:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsdel-mini.danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.dsdel-mini.danger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-base)}
.dsdel-mini:disabled{opacity:.5;cursor:default}
.dsdel-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px 16px;color:var(--dsw-alias-label-tertiary)}
.dsdel-empty svg{width:30px;height:30px;opacity:.7}
.dsdel-empty-text{font-size:13px}
`

    function insertStyle() {
      if (typeof document === 'undefined') return () => {}
      const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG)}]`)
      if (existing !== null) return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = '@local/session-delete'
      tag.dataset.pluginCss = STYLE_TAG
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => {
        tag.remove()
      }
    }

    function SearchIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', 'aria-hidden': true },
        h('circle', { cx: 7, cy: 7, r: 4.2 }),
        h('path', { d: 'M10.2 10.2L13.4 13.4' }),
      )
    }

    function ChevronIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M4 6l4 4 4-4' }),
      )
    }

    function ArchiveIcon({ size = 15 }) {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('rect', { x: 2.2, y: 3.2, width: 11.6, height: 3, rx: 0.8 }),
        h('path', { d: 'M3.2 6.2v6.1c0 .5.4.9.9.9h7.8c.5 0 .9-.4.9-.9V6.2' }),
        h('path', { d: 'M6.4 8.6h3.2' }),
      )
    }

    function TrashIcon({ size = 15 }) {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M3 4.6h10' }),
        h('path', { d: 'M6.2 4.6V3.4c0-.5.4-.9.9-.9h1.8c.5 0 .9.4.9.9v1.2' }),
        h('path', { d: 'M4.3 4.6l.6 8.1c.05.65.6 1.15 1.25 1.15h3.7c.65 0 1.2-.5 1.25-1.15l.6-8.1' }),
        h('path', { d: 'M6.8 7.2v4.1M9.2 7.2v4.1' }),
      )
    }

    function codeError(code) {
      const error = new Error(code)
      error.code = code
      return error
    }

    async function callDelete(request) {
      const response = await fetch(ROUTE, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-dsh-session-delete': '1',
        },
        body: JSON.stringify(request.kind === 'all' ? { all: true } : { sessionId: request.sessionId }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || data === null || data.ok !== true) {
        throw codeError(typeof data?.code === 'string' ? data.code : 'FAILED')
      }
      return data
    }

    function errorText(error, t) {
      switch (error?.code) {
        case 'ACTIVE':
        case 'BUSY':
          return t('error.active')
        case 'NOT_ARCHIVED':
          return t('error.notArchived')
        case 'FORBIDDEN':
        case 'ORIGIN':
          return t('error.forbidden')
        default:
          return t('error.failed')
      }
    }

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    function formatDate(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms)) return ''
      return dateFormatter.format(new Date(ms))
    }

    function workspaceLabel(workspace, t) {
      const title = typeof workspace.title === 'string' ? workspace.title.trim() : ''
      if (title !== '') return title
      const path = typeof workspace.path === 'string' ? workspace.path : ''
      const base = path.split(/[\\/]/).filter(Boolean).at(-1)
      return base !== undefined ? base : t('group.ungrouped')
    }

    function displayTitle(summary, t) {
      const title = typeof summary.title === 'string' ? summary.title.trim() : ''
      return title !== '' ? title : t('untitled')
    }

    function ArchivedChatsPage({ useWorkspaces, useSessions, unarchive, t }) {
      const workspaces = useWorkspaces((snapshot) => snapshot)
      const sessions = useSessions((snapshot) => snapshot)
      const [query, setQuery] = React.useState('')
      const [workspaceFilter, setWorkspaceFilter] = React.useState('')
      const [filterOpen, setFilterOpen] = React.useState(false)
      const [pending, setPending] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const filterRef = React.useRef(null)

      React.useEffect(() => {
        if (!filterOpen) return
        const onPointerDown = (event) => {
          if (filterRef.current !== null && !filterRef.current.contains(event.target)) setFilterOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setFilterOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
          document.removeEventListener('mousedown', onPointerDown)
          document.removeEventListener('keydown', onKeyDown)
        }
      }, [filterOpen])

      const groups = React.useMemo(() => {
        const archivedIds = new Set(workspaces.archivedSessionIds ?? [])
        const accounted = new Set()
        const result = []
        for (const workspace of Array.isArray(workspaces.items) ? workspaces.items : []) {
          const members = []
          for (const id of Array.isArray(workspace.sessionIds) ? workspace.sessionIds : []) {
            if (!archivedIds.has(id)) continue
            const summary = sessions.byId?.[id]
            if (summary === undefined) continue
            accounted.add(id)
            if (summary.origin === 'subagent' || summary.blank === true) continue
            members.push({ id, summary })
          }
          if (members.length === 0) continue
          members.sort((left, right) => (right.summary.updatedAt ?? 0) - (left.summary.updatedAt ?? 0))
          result.push({ key: workspace.workspaceId, label: workspaceLabel(workspace, t), members })
        }
        const stray = []
        for (const id of archivedIds) {
          if (accounted.has(id)) continue
          const summary = sessions.byId?.[id]
          if (summary === undefined) continue
          if (summary.origin === 'subagent' || summary.blank === true) continue
          stray.push({ id, summary })
        }
        if (stray.length > 0) {
          stray.sort((left, right) => (right.summary.updatedAt ?? 0) - (left.summary.updatedAt ?? 0))
          result.push({ key: '', label: t('group.ungrouped'), members: stray })
        }
        return result
      }, [workspaces, sessions, t])

      const total = groups.reduce((sum, group) => sum + group.members.length, 0)
      const filterOptions = React.useMemo(
        () => [
          { value: '', label: t('filter.all') },
          ...groups.filter((group) => group.key !== '').map((group) => ({ value: group.key, label: group.label })),
        ],
        [groups, t],
      )

      React.useEffect(() => {
        if (workspaceFilter === '') return
        if (!groups.some((group) => group.key === workspaceFilter)) setWorkspaceFilter('')
      }, [groups, workspaceFilter])

      const normalizedQuery = query.trim().toLowerCase()
      const visibleGroups = groups
        .filter((group) => workspaceFilter === '' || group.key === workspaceFilter)
        .map((group) => ({
          ...group,
          members: group.members.filter((member) =>
            normalizedQuery === '' ? true : displayTitle(member.summary, t).toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.members.length > 0)

      const currentFilter =
        filterOptions.find((option) => option.value === workspaceFilter)?.label ?? t('filter.all')

      async function unarchiveOne(id) {
        if (busy) return
        setError(null)
        try {
          await unarchive(id)
        } catch (failure) {
          setError(errorText(failure, t))
        }
      }

      async function deleteOne(id) {
        if (busy) return
        setBusy(true)
        setError(null)
        setNotice(null)
        try {
          await callDelete({ kind: 'one', sessionId: id })
          setPending(null)
        } catch (failure) {
          setError(errorText(failure, t))
          setPending(null)
        } finally {
          setBusy(false)
        }
      }

      async function deleteAll() {
        if (busy) return
        setBusy(true)
        setError(null)
        setNotice(null)
        try {
          const data = await callDelete({ kind: 'all' })
          setPending(null)
          const skipped = Array.isArray(data.skipped) ? data.skipped.length : 0
          if (skipped > 0) {
            const removed = Array.isArray(data.removed) ? data.removed.length : 0
            setNotice(t('notice.skipped', { removed, skipped }))
          }
        } catch (failure) {
          setError(errorText(failure, t))
          setPending(null)
        } finally {
          setBusy(false)
        }
      }

      const row = (member) => {
        const title = displayTitle(member.summary, t)
        const confirming = pending !== null && pending.kind === 'one' && pending.id === member.id
        return h(
          'div',
          { key: member.id, className: 'dsdel-row' },
          h(
            'div',
            { className: 'dsdel-row-main' },
            h('div', { className: 'dsdel-row-title', title }, title),
            h('div', { className: 'dsdel-row-date' }, formatDate(member.summary.updatedAt)),
          ),
          confirming
            ? h(
                'div',
                { className: 'dsdel-row-confirm' },
                h('span', null, t('confirm.row')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsdel-mini',
                    disabled: busy,
                    onClick: () => setPending(null),
                  },
                  t('cancel'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsdel-mini danger',
                    disabled: busy,
                    onClick: () => deleteOne(member.id),
                  },
                  busy ? t('deleting') : t('delete'),
                ),
              )
            : h(
                'div',
                { className: 'dsdel-row-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsdel-icon-button',
                    title: t('delete'),
                    'aria-label': t('delete'),
                    disabled: busy,
                    onClick: () => {
                      setError(null)
                      setNotice(null)
                      setPending({ kind: 'one', id: member.id })
                    },
                  },
                  h(TrashIcon),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsdel-unarchive',
                    disabled: busy,
                    onClick: () => unarchiveOne(member.id),
                  },
                  t('unarchive'),
                ),
              ),
        )
      }

      return h(
        'div',
        { className: 'dsdel-page' },
        h(
          'div',
          { className: 'dsdel-header' },
          h(
            'div',
            { className: 'dsdel-heading' },
            h('h1', { className: 'dsdel-title' }, t('page.title')),
            h('p', { className: 'dsdel-subtitle' }, t('page.subtitle', { count: total })),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsdel-danger-button',
              disabled: busy || total === 0,
              onClick: () => {
                setError(null)
                setNotice(null)
                setPending({ kind: 'all' })
              },
            },
            h(TrashIcon, { size: 14 }),
            t('deleteAll'),
          ),
        ),
        error === null ? null : h('div', { className: 'dsdel-banner error', role: 'alert' }, error),
        notice === null ? null : h('div', { className: 'dsdel-banner notice' }, notice),
        pending !== null && pending.kind === 'all'
          ? h(
              'div',
              { className: 'dsdel-confirm-bar' },
              h('span', { className: 'dsdel-confirm-text' }, t('confirm.all', { count: total })),
              h(
                'div',
                { className: 'dsdel-confirm-actions' },
                h(
                  'button',
                  { type: 'button', className: 'dsdel-button', disabled: busy, onClick: () => setPending(null) },
                  t('cancel'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsdel-button danger',
                    disabled: busy,
                    onClick: deleteAll,
                  },
                  busy ? t('deleting') : t('delete'),
                ),
              ),
            )
          : null,
        h(
          'div',
          { className: 'dsdel-toolbar' },
          h(
            'div',
            { className: 'dsdel-search' },
            h(SearchIcon),
            h('input', {
              className: 'dsdel-input',
              type: 'search',
              value: query,
              placeholder: t('search.placeholder'),
              'aria-label': t('search.placeholder'),
              onChange: (event) => setQuery(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'dsdel-filter', ref: filterRef },
            h(
              'button',
              {
                type: 'button',
                className: 'dsdel-filter-button',
                'aria-haspopup': 'listbox',
                'aria-expanded': filterOpen,
                onClick: () => setFilterOpen((open) => !open),
              },
              h('span', null, currentFilter),
              h(ChevronIcon),
            ),
            filterOpen
              ? h(
                  'div',
                  { className: 'dsdel-filter-menu', role: 'listbox' },
                  filterOptions.map((option) =>
                    h(
                      'button',
                      {
                        key: option.value === '' ? '__all__' : option.value,
                        type: 'button',
                        role: 'option',
                        className: 'dsdel-filter-option',
                        'data-selected': option.value === workspaceFilter,
                        'aria-selected': option.value === workspaceFilter,
                        onClick: () => {
                          setWorkspaceFilter(option.value)
                          setFilterOpen(false)
                        },
                      },
                      option.label,
                    ),
                  ),
                )
              : null,
          ),
        ),
        total === 0
          ? h(
              'div',
              { className: 'dsdel-empty' },
              h(ArchiveIcon, { size: 30 }),
              h('div', { className: 'dsdel-empty-text' }, t('empty.none')),
            )
          : visibleGroups.length === 0
            ? h(
                'div',
                { className: 'dsdel-empty' },
                h(ArchiveIcon, { size: 30 }),
                h('div', { className: 'dsdel-empty-text' }, t('empty.filter')),
              )
            : visibleGroups.map((group) =>
                h(
                  'section',
                  { key: group.key === '' ? '__ungrouped__' : group.key, className: 'dsdel-group' },
                  h(
                    'div',
                    { className: 'dsdel-group-header' },
                    h('div', { className: 'dsdel-group-title' }, h(ArchiveIcon), h('span', null, group.label)),
                    h('span', { className: 'dsdel-group-count' }, t('group.count', { count: group.members.length })),
                  ),
                  h('div', { className: 'dsdel-list' }, group.members.map(row)),
                ),
              ),
      )
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(insertStyle, 'session-delete: styles')
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-delete: dictionaries')
        const t = ctx.locale.bind(NS)
        const uiWorkspace = ctx.uiWorkspace

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'archived-sessions',
              order: 17,
              locale: NS,
              label: () => t('nav.archived'),
              inject: () => ({
                unarchive: (sessionId) => uiWorkspace.unarchiveSession(sessionId),
              }),
            },
            ArchivedChatsPage,
          ),
        )
      },
    }
}

function createEditMessageClient(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'edit-message'

    /** Simplified Chinese dictionary (key-set source of truth). */
    const zh = {
      'action.edit': '编辑消息',
      'action.copy': '复制',
      'action.copied': '已复制',
      'editor.placeholder': '编辑消息…',
      'editor.cancel': '取消',
      'editor.send': '发送',
      'editor.sending': '发送中…',
      'editor.failed': '重发失败，请重试',
      'editor.busy': '会话正忙，请稍后重试',
      'editor.stale': '这条消息已变化，请刷新后重试',
      'editor.missing': '找不到这条会话',
      'editor.unavailable': '当前无法编辑这条消息',
      'editor.timeout': '发送超时，原消息未更改，请重试',
      'editor.resume': '会话恢复失败，原消息未更改，请重试',
      'editor.recovery': '回退失败，原消息已保留，请重启 Harness 后重试',
      'clock.md': '{m}月{d}日',
      'clock.ymd': '{y}年{m}月{d}日',
    }
    /** English dictionary, checked complete against the zh key set. */
    const en = {
      'action.edit': 'Edit message',
      'action.copy': 'Copy',
      'action.copied': 'Copied',
      'editor.placeholder': 'Edit message…',
      'editor.cancel': 'Cancel',
      'editor.send': 'Send',
      'editor.sending': 'Sending…',
      'editor.failed': 'Could not resend. Try again.',
      'editor.busy': 'The conversation is busy. Try again shortly.',
      'editor.stale': 'This message changed. Refresh and try again.',
      'editor.missing': 'This conversation could not be found.',
      'editor.unavailable': 'This message cannot be edited right now.',
      'editor.timeout': 'Sending timed out. The original message was not changed. Try again.',
      'editor.resume': 'The conversation could not be resumed. The original message was not changed.',
      'editor.recovery': 'The rewind failed and the original message was kept. Restart Harness and try again.',
      'clock.md': '{m}/{d}',
      'clock.ymd': '{y}/{m}/{d}',
    }

    const STYLE_TAG = '@local/edit-message/EditMessageRow.css'
    const CSS = `
.dshem-row{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.dshem-actions{display:flex;align-items:center;gap:8px;height:calc(28px + var(--dsh-content-font-delta,0px))}
.dshem-time{color:var(--dsw-alias-label-tertiary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));white-space:nowrap;padding-right:12px}
.dshem-action{width:calc(28px + var(--dsh-content-font-delta,0px));height:calc(28px + var(--dsh-content-font-delta,0px));border-radius:var(--dsw-radius-sm);border:none;background:0 0;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center;padding:6px;cursor:pointer;transition:background .1s,color .1s}
.dshem-action:hover,.dshem-action:focus-visible{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dshem-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshem-action svg{width:calc(15px + var(--dsh-content-font-delta,0px));height:calc(15px + var(--dsh-content-font-delta,0px));display:block}
.dshem-editor{box-sizing:border-box;width:100%;background:var(--dsw-specific-bubble);border-radius:var(--dsw-radius-xl);padding:14px 18px 12px;display:flex;flex-direction:column;gap:8px}
.dshem-input{box-sizing:border-box;width:100%;min-height:calc(22px + var(--dsh-content-font-delta,0px));max-height:40vh;margin:0;padding:0;border:none;outline:none;background:0 0;resize:none;overflow-y:auto;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:var(--dsh-content-font-size,14px);line-height:calc(22px + var(--dsh-content-font-delta,0px));white-space:pre-wrap;word-break:break-word}
.dshem-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.dshem-editor-actions{display:flex;justify-content:flex-end;gap:8px}
.dshem-button{height:32px;padding:0 16px;border-radius:var(--dsw-radius-sm);border:none;font-family:inherit;font-size:13px;line-height:1;cursor:pointer;transition:background .1s,opacity .1s}
.dshem-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dshem-button:disabled{opacity:.45;cursor:default}
.dshem-cancel{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dshem-cancel:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.dshem-send{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font-weight:500}
.dshem-error{margin-top:-2px;color:var(--dsw-alias-state-error-primary);font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(18px + var(--dsh-content-font-delta-secondary,0px))}
@media (hover:hover){
  .dshem-actions{opacity:0;transition:opacity 80ms}
  .dshem-row:hover .dshem-actions,.dshem-row:focus-within .dshem-actions{opacity:1}
}
`

    function insertStyle() {
      if (typeof document === 'undefined') return () => {}
      const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG)}]`)
      if (existing !== null) return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = '@local/edit-message'
      tag.dataset.pluginCss = STYLE_TAG
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => {
        tag.remove()
      }
    }

    function CopyIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('rect', { x: 5.6, y: 5.6, width: 7.2, height: 7.2, rx: 1.5 }),
        h('path', {
          d: 'M10.4 5.6V4.2c0-.9-.7-1.6-1.6-1.6H4.2c-.9 0-1.6.7-1.6 1.6v4.6c0 .9.7 1.6 1.6 1.6h1.4',
        }),
      )
    }

    function CheckIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M3.6 8.4l2.9 2.9 5.9-6.6' }),
      )
    }

    function PencilIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M3.2 12.8l.4-2.5 7.2-7.2a1.4 1.4 0 0 1 2 0l.1.1a1.4 1.4 0 0 1 0 2L5.7 12.4z' }),
        h('path', { d: 'M9.9 4.2l2 2' }),
      )
    }

    /** Split message content the way the shipped user-message row does. */
    function prepareContent(data) {
      const blocks = Array.isArray(data.content) ? data.content : []
      let text = ''
      const attachments = []
      const extraBlocks = []
      for (const block of blocks) {
        if (block === null || typeof block !== 'object') {
          extraBlocks.push(block)
        } else if (block.type === 'text' && typeof block.text === 'string') {
          text += block.text
        } else if (block.type === 'image' && block.attachment !== undefined) {
          attachments.push({ type: 'image', image: { attachment: block.attachment } })
        } else if (block.type === 'file' && block.attachment !== undefined) {
          attachments.push({ type: 'file', file: block.attachment })
        } else {
          extraBlocks.push(block)
        }
      }
      const referenceLabels = Array.isArray(data.referenceLabels) ? data.referenceLabels : undefined
      const skillNames = Array.isArray(data.skillNames) ? data.skillNames : undefined
      const content = {
        text,
        attachments,
        extraBlocks,
        ...(referenceLabels === undefined ? {} : { referenceLabels }),
      }
      const facts = {
        ...(referenceLabels === undefined ? {} : { sessionLabels: referenceLabels }),
        ...(skillNames === undefined ? {} : { skillNames }),
      }
      return { text, content, facts }
    }

    function pad2(value) {
      return value < 10 ? `0${value}` : String(value)
    }

    function clockText(time, t) {
      if (typeof time !== 'number' || !Number.isFinite(time)) return ''
      const d = new Date(time)
      const now = new Date()
      const clock = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
        return clock
      }
      const params = { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
      const day = d.getFullYear() === now.getFullYear() ? t('clock.md', params) : t('clock.ymd', params)
      return `${day} ${clock}`
    }

    async function writeClipboard(text) {
      if (typeof navigator === 'undefined' || navigator.clipboard === undefined) return false
      if (typeof navigator.clipboard.writeText !== 'function') return false
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return false
      }
    }

    function rewriteErrorText(error, t) {
      const code = typeof error?.code === 'string' ? error.code : undefined
      if (code === 'BUSY') return t('editor.busy')
      if (code === 'STALE' || code === 'BAD_SEQ') return t('editor.stale')
      if (code === 'NOT_FOUND' || code === 'NO_LOG') return t('editor.missing')
      if (code === 'UNAVAILABLE' || code === 'FORBIDDEN') return t('editor.unavailable')
      if (code === 'ACCEPT_TIMEOUT') return t('editor.timeout')
      if (code === 'RESUME_FAILED') return t('editor.resume')
      if (code === 'RECOVERY') return t('editor.recovery')
      return t('editor.failed')
    }

    function clientTimeZone() {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return undefined
      }
    }

    /**
     * User-message row: shipped content Factory, copy/edit actions, and an inline
     * editor. Replaces the Chat `user` keyed node renderer.
     */
    function EditMessageRow({ node, sessionId, renderFactorySlot, loadImage, useAccess, useChat, rewriteMessage, t }) {
      const data = node.data
      const prepared = React.useMemo(() => prepareContent(data), [data])
      const text = prepared.text
      const canRewrite = useAccess('session/fork') === true
      const turn =
        node.location !== undefined && (node.location.kind === 'turn' || node.location.kind === 'step')
          ? node.location.turn.turn
          : undefined
      const isTurnEditable = useChat((snapshot) => {
        if (turn === undefined) return false
        const keys = snapshot.locations.getTurn(turn)
        for (let index = keys.length - 1; index >= 0; index -= 1) {
          const candidate = snapshot.nodes.get(keys[index])
          if (candidate?.kind !== 'user' || candidate.data?.source?.kind !== 'user') continue
          return candidate.key === node.key
        }
        return false
      })
      const isTurnSettled = useChat(
        (snapshot) => turn !== undefined && snapshot.timeline.turns.get(turn)?.end !== undefined,
      )
      const anchorSeq = typeof node.anchorSeq === 'number' ? node.anchorSeq : node.seq
      const showEdit =
        canRewrite &&
        isTurnEditable &&
        isTurnSettled &&
        data.source?.kind === 'user' &&
        typeof anchorSeq === 'number' &&
        Number.isSafeInteger(anchorSeq) &&
        anchorSeq >= 0

      const [copied, setCopied] = React.useState(false)
      const [editing, setEditing] = React.useState(false)
      const [value, setValue] = React.useState('')
      const [sending, setSending] = React.useState(false)
      const [error, setError] = React.useState(null)
      const copiedTimer = React.useRef(null)
      const copyPending = React.useRef(false)
      const sendPending = React.useRef(false)
      const inputRef = React.useRef(null)

      React.useEffect(
        () => () => {
          if (copiedTimer.current !== null) clearTimeout(copiedTimer.current)
        },
        [],
      )

      React.useLayoutEffect(() => {
        if (!editing) return
        const el = inputRef.current
        if (el === null) return
        el.focus()
        const end = el.value.length
        try {
          el.setSelectionRange(end, end)
        } catch {}
      }, [editing])

      React.useLayoutEffect(() => {
        const el = inputRef.current
        if (!editing || el === null) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
      }, [editing, value])

      const onCopy = React.useCallback(() => {
        if (copyPending.current) return
        copyPending.current = true
        writeClipboard(text).then((ok) => {
          copyPending.current = false
          if (!ok) return
          setCopied(true)
          if (copiedTimer.current !== null) clearTimeout(copiedTimer.current)
          copiedTimer.current = setTimeout(() => {
            copiedTimer.current = null
            setCopied(false)
          }, 1000)
        })
      }, [text])

      const onEdit = React.useCallback(() => {
        setError(null)
        setSending(false)
        setValue(text)
        setEditing(true)
      }, [text])

      const onCancel = React.useCallback(() => {
        if (sendPending.current) return
        setEditing(false)
        setSending(false)
        setError(null)
      }, [])

      const onSend = React.useCallback(async () => {
        if (sendPending.current || value.trim() === '') return
        sendPending.current = true
        setSending(true)
        setError(null)
        try {
          const started = await rewriteMessage({
            sessionId,
            seq: anchorSeq,
            messageId: data.id,
            messageRpcId: data.source?.rpcId,
            text: value,
            clientTimeZone: clientTimeZone(),
          })
          if (started) {
            setEditing(false)
            setSending(false)
            return
          }
          setSending(false)
          setError(t('editor.failed'))
        } catch (failure) {
          console.error('[edit-message] resend failed:', failure)
          setSending(false)
          setError(rewriteErrorText(failure, t))
        } finally {
          sendPending.current = false
        }
      }, [anchorSeq, data.id, data.source?.rpcId, rewriteMessage, sessionId, t, value])

      const onKeyDown = React.useCallback(
        (event) => {
          const native = event.nativeEvent
          if (native !== undefined && (native.isComposing === true || native.keyCode === 229)) return
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
            return
          }
          if (event.key === 'Enter' && event.shiftKey !== true) {
            event.preventDefault()
            onSend()
          }
        },
        [onCancel, onSend],
      )

      if (editing) {
        return h(
          'div',
          { className: 'dshem-row', 'data-edit-message-row': true, 'data-editing': true },
          h(
            'div',
            { className: 'dshem-editor' },
            h('textarea', {
              ref: inputRef,
              className: 'dshem-input',
              value,
              rows: 1,
              placeholder: t('editor.placeholder'),
              'aria-label': t('editor.placeholder'),
              spellCheck: false,
              onChange: (event) => setValue(event.target.value),
              onKeyDown,
            }),
            error === null ? null : h('div', { className: 'dshem-error', role: 'alert' }, error),
            h(
              'div',
              { className: 'dshem-editor-actions' },
              h(
                'button',
                { type: 'button', className: 'dshem-button dshem-cancel', onClick: onCancel, disabled: sending },
                t('editor.cancel'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshem-button dshem-send',
                  onClick: onSend,
                  disabled: sending || value.trim() === '',
                },
                sending ? t('editor.sending') : t('editor.send'),
              ),
            ),
          ),
        )
      }

      const actions = []
      const time = clockText(data.time, t)
      if (time !== '') actions.push(h('span', { key: 'time', className: 'dshem-time' }, time))
      actions.push(
        h(
          'button',
          {
            key: 'copy',
            type: 'button',
            className: 'dshem-action',
            title: copied ? t('action.copied') : t('action.copy'),
            'aria-label': copied ? t('action.copied') : t('action.copy'),
            onClick: onCopy,
          },
          copied ? h(CheckIcon) : h(CopyIcon),
        ),
      )
      if (showEdit) {
        actions.push(
          h(
            'button',
            {
              key: 'edit',
              type: 'button',
              className: 'dshem-action',
              title: t('action.edit'),
              'aria-label': t('action.edit'),
              onClick: onEdit,
            },
            h(PencilIcon),
          ),
        )
      }

      return h(
        'div',
        { className: 'dshem-row', 'data-edit-message-row': true },
        renderFactorySlot('conversation.chat.user.content', {
          content: prepared.content,
          loadImage,
          facts: prepared.facts,
          interactive: true,
        }),
        h('div', { className: 'dshem-actions', 'data-clock': 'start' }, actions),
      )
    }

    /** Emergency fallback so a renderer problem never hides a user message. */
    function PlainUserFallback({ node }) {
      const prepared = prepareContent(node.data)
      if (prepared.text === '') return null
      return h(
        'div',
        { style: { display: 'flex', justifyContent: 'flex-end' } },
        h(
          'div',
          {
            style: {
              maxWidth: '82%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'var(--dsw-specific-bubble)',
              borderRadius: 'var(--dsw-radius-xl)',
              padding: '10px 16px',
              color: 'var(--dsw-alias-label-primary)',
              fontSize: 'var(--dsh-content-font-size,14px)',
              lineHeight: 'calc(22px + var(--dsh-content-font-delta,0px))',
            },
          },
          prepared.text,
        ),
      )
    }

    class UserRowBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      componentDidCatch(error) {
        console.error('[edit-message] user message row failed:', error)
      }

      render() {
        if (this.state.failed) return h(PlainUserFallback, this.props)
        return this.props.children
      }
    }

    function EditMessageRowGuard(props) {
      return h(UserRowBoundary, { node: props.node }, h(EditMessageRow, props))
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(insertStyle, 'edit-message: user row styles')
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'edit-message: dictionaries')

        async function refreshSession(sessionId) {
          await ctx.sessions.refresh().catch((error) => {
            console.warn('[edit-message] could not refresh the session list:', error)
          })
          const session = ctx.sessions.manager.get(sessionId)
          // `api-session/added` intentionally preserves the removed latch. This
          // same-id lifecycle is live again, so clear the latch and rebuild both
          // the history window and its follow stream in place.
          session.removed = false
          await session.resync()
        }

        async function rewriteMessage({
          sessionId,
          seq,
          messageId,
          messageRpcId,
          text,
          clientTimeZone,
        }) {
          if (typeof sessionId !== 'string') return false
          if (typeof seq !== 'number' || !Number.isSafeInteger(seq) || seq < 0) return false
          const response = await fetch('/edit-message/rewrite', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'content-type': 'application/json',
              'x-dsh-edit-message': '1',
            },
            body: JSON.stringify({
              sessionId,
              userSeq: seq,
              messageId,
              messageRpcId,
              text,
              clientTimeZone,
            }),
          })
          const result = await response.json().catch(() => null)
          if (!response.ok || result?.ok !== true) {
            const error = new Error(result?.code ?? `HTTP ${response.status}`)
            error.code = result?.code
            throw error
          }
          void refreshSession(sessionId).catch((error) => {
            console.warn('[edit-message] rewrite succeeded; falling back to a page reload:', error)
            globalThis.location?.reload()
          })
          return true
        }

        ctx.slots.inject('conversation.chat.node', () =>
          ctx.slots.register(
            {
              name: 'conversation.chat.node',
              key: 'user',
              priority: -1,
              locale: NS,
              inject: () => ({ rewriteMessage }),
            },
            EditMessageRowGuard,
          ),
        )
      },
    }
}
