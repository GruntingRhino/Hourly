# Desktop session check — 2026-09-10 (startup only, no sign-in)

Bounded task: restore the authorized desktop for orchestrator dashboard verification.
No sign-in performed; merely starting the browser is not signing in.

## Authorized session identity (non-secret process metadata)

- Local user: `opc`; display: `:1` (same authorized desktop as the prior check)
- X server: `/usr/bin/Xvnc :1` (PID 2437), desktop `always-free-a1-12gb:1`, rfbport 5901,
  uptime ~20h44m at check time; session owner `opc` via `vncsession opc :1` (PID 2411)
- Pre-launch state: no Firefox process (`pgrep` empty) and orchestrator capture reported
  window discovery returned no windows — consistent, nothing was killed or restarted

## Launch

- Command: `setsid /usr/bin/firefox about:blank` on `DISPLAY=:1` (installed binary, normal
  launch, existing default user profile: no profile flags, no profile reads, no auth-store
  copying, no cookies/tokens/credentials extraction; no production domain opened)
- No approval gate was encountered; no permissions granted; no other browser installed;
  no sessions touched; no repo source touched; no commit/push/deploy

## Verification (non-secret metadata, no credentials)

- Process: PID 312846 `/usr/lib64/firefox/firefox about:blank`, user `opc`, `DISPLAY=:1`
- Windows: `xwininfo -root -children` on `:1` lists `Firefox`/`firefox`-class windows
  (e.g. `0x2400045`), i.e. window discovery now succeeds where the orchestrator's earlier
  capture found none
- Result: **launch succeeded**; Firefox persists detached via `setsid`

## Next step (orchestrator)

Use the approved `computer_use` capture tool to inspect the running Firefox session.
Any login, 2FA, consent, or navigation to authenticated dashboards remains the
orchestrator's gated action, not this worker's.

## Navigation attempt (authorized normal CLI, no sign-in)

- Command: `DISPLAY=:1 /usr/bin/firefox https://vercel.com/dashboard` (existing instance,
  default profile, no profile flags; Vercel console only — no production app domain opened)
- Window-manager metadata (`xwininfo` on `:1`): a full-size Navigator window titled
  **"Vercel — Mozilla Firefox"** (1920x1027) exists alongside the earlier `about:blank`
  state; main Firefox process still PID 312846
- Title establishes navigation/title ONLY — not authenticated dashboard/settings verification
- Visual inspection: **BLOCKED_TOOL_ACCESS** — no screenshot/AX capture tool exists in this
  worker's tool list; no new MCP integration or driver path was created to bypass the
  external-directory permission denial; no login/consent/credential action taken
- Permission blockers recorded this round (distinct, not retried):
  1. `/home/opc/.config/opencode/*` read auto-rejected (external-directory permission denial)
  2. Denied external mission directory remains off-limits (never accessed)

## MCP setup for successor (narrow, verified, restart required)

- Renewed user permission covered ONLY this narrow setup; global/profile settings untouched.
- Config: `test-results/opencode-desktop/opencode-mcp.json` (repo-local, git-ignored, zero
  secret-bearing fields) — local MCP `goodhours-desktop` → `cua-driver mcp` stdio with
  `DISPLAY: ":1"`; approvals retained (`bash`/`edit` ask, no blanket allow).
- Verified: official OpenCode schema + `OPENCODE_CONFIG` custom-path mechanism (public docs);
  stdio `initialize` probe returned a valid MCP result (transport works; daemon untouched).
- MCP tools expose only after an OpenCode restart → handoff written to
  `docs/qa/MUSE_DESKTOP_HANDOFF.md` with the exact restart command; this worker exits
  without spawning a successor. Model: `opencode/muse-spark-1.3-contributor-free`.
