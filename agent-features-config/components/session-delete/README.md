# Archived Chats

Adds **已归档的聊天 / Archived chats** to Settings, modelled on the Codex desktop
archive page: the page lists archived conversations grouped by project, with search, a
project filter, per-row **取消归档 / Unarchive** and **删除 / Delete**, and a top-right
**全部删除 / Delete all**.

The archived view is reached from the Settings sidebar; it uses the `archived-sessions`
section id, so the settings shell renders its archive icon. Each delete asks for an
inline confirmation (row-level, or a banner for Delete all) — no blocking browser dialog.

## How deletion works

DSH deliberately has no session-deletion API: `dsh-session-persistence-jsonl` says
"nothing deletes session files — logs accumulate under root until removed externally; the
seam has no deletion API." This plugin fills that gap for archived sessions:

1. The Host verifies the id is in `workspaceRegistry.archivedSessionIds`.
2. If the session is still loaded, it invokes the exact
   `agentLoop.lifecycle(<session-id>)` disposer created by DSH. That runs the official
   teardown: cancel the current turn, wait until idle, dispose the agent scope, close
   and drain the JSONL write handle, release its lock, and detach the session.
3. It removes the session-owned directory under the persistence root
   (`<DSH_HOME>/sessions/<project>/<session-id>/`), all format generations included.
4. It removes the matching projection checkpoint
   (`<DSH_HOME>/storages/session_projcache/sessions/<session-id>.json`).
5. It emits the allowlisted `api-session/removed` Host event, so the open page drops the
   summary immediately.
6. Files shared by other sessions (attachments, workspaces) are left alone.

The session search index is derived and reconciles deleted sources on its next
observation, so it needs no separate cleanup.

### Safety

- Only sessions in the archived set can be deleted.
- A loaded session is closed through the same lifecycle teardown used by DSH before its
  files are touched. No restart is required.
- If DSH cannot complete teardown (for example, a tool refuses to stop), deletion returns
  a busy error and leaves the session files intact.
- The browser calls a Host route (`POST /session-delete/delete`). The route requires a
  `x-dsh-session-delete: 1` header (a cross-site page cannot send it without a failed
  CORS preflight), a JSON content type, and a loopback Origin on the same port when the
  request carries one.

## Install

Install this directory as a bundle (`plugin_manager install_bundle`). The Client half
registers the Settings section; reload the page only if the section or actions do not
appear after the client plugin reloads.

## Files

- `index.js` — Host: deletion, route, `api-session/removed`.
- `client.js` — Client: the Settings page (list, search, filter, unarchive, delete).
- `cordis.patch.yml` — inserts the `session-delete` plugin row.
- `locale/*.json` — Plugin Manager metadata.
- `icon.svg` — Plugin icon.

## Notes

The page reads the same client snapshots as the sidebar (`useWorkspaces` +
`useSessions`), so unarchive/delete update it live. Styling uses `--dsw-alias-*` tokens
only.
