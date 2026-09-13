# Muse desktop handoff — approved computer_use MCP setup (verified, restart required)

Model for successor: `opencode/muse-spark-1.3-contributor-free` (same as this worker).
MCP tools require an OpenCode restart to expose, so this worker stops here; the orchestrator
launches the successor. This worker did NOT spawn another agent.

## Exact restart command (orchestrator runs this, not the worker)

```bash
OPENCODE_CONFIG=/home/opc/RTB/projects/goodhours/test-results/opencode-desktop/opencode-mcp.json \
/home/opc/.hermes/profiles/rtb/tools/opencode/node_modules/.bin/opencode run \
  --model opencode/muse-spark-1.3-contributor-free \
  --format json \
  '<mission prompt directing Vercel hourly-dev dashboard verification with goodhours-desktop tools>'
```

- Config path (repo-local, git-ignored via `test-results/`, not staged/publishable):
  `/home/opc/RTB/projects/goodhours/test-results/opencode-desktop/opencode-mcp.json`
- No global/profile settings were changed; no `opencode mcp add` was run; no secrets exist
  in the config (verified: zero secret-bearing fields; only `DISPLAY: ":1"`).
- Per-action approvals retained: config sets `permission: {bash: "ask", edit: "ask"}`; no
  blanket allow, no `--auto`, no disabled checks.

## Verified setup facts (this worker, read-only)

- Schema: official OpenCode local-MCP shape (`type: "local"`, `command[]`, `environment`,
  `enabled`, `timeout`) per https://opencode.ai/docs/mcp-servers; custom-config path via
  `OPENCODE_CONFIG` per https://opencode.ai/docs/config/ (loaded between global and project
  configs; no repo-root `opencode.json`/`.opencode` exists to conflict).
- Transport: `/home/opc/.local/bin/cua-driver mcp` (v0.25.0) speaks MCP over stdio —
  a documented `initialize` probe returned a valid result with server instructions
  (capture-first ladder: `list_windows`/`get_desktop_state` before input; verify-state
  postconditions; never advance on transport success alone). Daemon not running;
  no update/install performed (v0.26.1 notice ignored deliberately).
- MCP server env gives the driver `DISPLAY: ":1"` (same-user default Xauthority applies).
- Browser state at handoff: Firefox PID 312846 on `opc DISPLAY=:1`, default profile, tab
  opened to `https://vercel.com/dashboard` ("Vercel — Mozilla Firefox" window title);
  auth status UNKNOWN — title is not login proof.

## Next browser action (successor, hourly-dev scope only)

1. Capture FIRST with `goodhours-desktop` read tools (`list_windows`, `get_desktop_state`);
   verify the dashboard page actually rendered and whether a logged-in session exists.
2. Only `hourly-dev` project settings: effective Git branch/Preview target/build command/
   deployment SHA and env presence/scope WITHOUT values. Avoid secret-exposing pages.
3. STOP at login/2FA/CAPTCHA/consent/identity/approval gates; never request secrets; no
   production domains/app data/config mutation; no commits/pushes/deployments.
4. Needed read-only answer: whether GitHub `main`/`dev` pushes would trigger production
   deployments/migrations across connected projects. If not provable in scope, say so
   precisely instead of assuming safe.
5. Record results in `docs/qa/DESKTOP_SESSION_CHECK.md` with sanitized evidence
   (URLs/project/deployment IDs/branch/SHA/env names only when observed).
