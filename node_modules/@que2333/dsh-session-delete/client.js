window.__ModuleLoader__.load({
  id: '@que2333/dsh-session-delete',
  factory(require) {
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

    const STYLE_TAG = '@que2333/dsh-session-delete/ArchivedChats.css'
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
      tag.dataset.plugin = '@que2333/dsh-session-delete'
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
  },
})
