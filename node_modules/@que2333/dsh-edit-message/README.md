# Edit Message

Adds an **编辑消息 / Edit message** action to every editable user turn in the Harness
conversation. Clicking it replaces the bubble with a textarea; sending removes that turn
and everything after it, then sends the edited message again in the **same Session**.

## Codex-compatible behavior

The visible result follows Codex's edit operation:

1. the session id does not change,
2. the edited user turn and all later turns are removed,
3. earlier turns remain unchanged,
4. the edited message is sent again with all original durable image/file attachments,
5. the page resumes following the same conversation and the model generates a new reply.

DSH does not expose Codex's `thread/revert` command or a truncate API for
`dsh-session`. The Host therefore implements an equivalent transactional rewind at the
persistence boundary:

1. cancel the live Agent and close its persistence writer using DSH's own lifecycle
   disposer,
2. inspect the stable log and locate the target message, its durable inbox insertion,
   and the `turn/start` that consumed it,
3. move the session directory to a temporary sibling backup,
4. rebuild the same session id from the exact event prefix before the inbox insertion,
   so the old queued prompt cannot run before the edited prompt,
5. resume the Agent and enqueue the edited message with its original attachments,
6. finish once DSH has durably accepted the edited prompt into the next-turn inbox,
   then delete the backup.

If any step fails, the new log is removed, the original directory is restored, and the
Agent is resumed before the request returns. The temporary backup is retained and logged
if recovery itself fails.

## Details

- The edit action is available on the last editable user message of each turn, not only
  the newest turn, and only after that turn has finished generating.
- The Client sends the original message id and request id. A duplicate or stale request
  is rejected instead of rewinding the newly generated message again.
- `Enter` sends, `Shift+Enter` inserts a newline, and `Esc` cancels. IME composition is
  respected.
- The Client closes the editor as soon as the Host accepts the prompt, then rebuilds the
  history/follow stream in the background. A page reload is only a fallback if that
  in-place resync fails.
- Attachments are read from the original durable message by the Host, so the browser does
  not need to upload them again.
- The inline row reuses the shipped `conversation.chat.user.content` Factory, so text,
  images, files, and reference summaries render as before.
- The action is shown only when the current client allows `session/fork`, matching the
  plugin's existing read/write admission gate.

## Files

- `index.js` — Host half: authenticated loopback route, same-id log rewind, rollback,
  Agent resume, and message resend.
- `client.js` — Client module: inline editor, Host request, and in-place Session resync.
- `cordis.patch.yml` — inserts the `edit-message` plugin row.
- `locale/*.json` — Plugin Manager metadata.
- `icon.svg` — Plugin icon.

## Notes

The user-message action row is not exposed as a slot, so the plugin replaces the
`conversation.chat.node` occupant keyed `user` (documented as replaceable). The new row
is wrapped in an error boundary that falls back to plain text if rendering fails. Styling
uses `--dsw-alias-*` and `--dsh-content-*` variables only.
