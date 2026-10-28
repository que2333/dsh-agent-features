window.__ModuleLoader__.load({
  id: '@que2333/dsh-agent-config',
  factory(require) {
    const React = require('react')
    const { createPortal } = require('react-dom')
    const h = React.createElement
    const NS = 'agent-config'
    const ENTRY_ID = 'agent-config'

    /** Simplified Chinese dictionary (key-set source of truth). */
    const zh = {
      'nav.config': '配置',
      'page.title': '配置',
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
      'nav.config': 'Configuration',
      'page.title': 'Configuration',
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

    const STYLE_TAG = '@que2333/dsh-agent-config/AgentConfig.css'
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
      tag.dataset.plugin = '@que2333/dsh-agent-config'
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
  },
})
