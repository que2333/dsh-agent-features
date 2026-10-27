window.__ModuleLoader__.load({
  id: '@local/edit-message',
  factory(require) {
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
  },
})
