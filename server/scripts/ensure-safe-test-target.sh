#!/usr/bin/env bash
#
# ensure-safe-test-target.sh — fail-closed guard for `npm test`.
#
# Runs in `pretest`, BEFORE node --test boots any child test process (node --test
# runs files concurrently, so no in-test assertion can protect the other files —
# the pilot test's own guard covers only itself). Validates the INHERITED
# environment only; values are never printed (refusals name the variable and the
# hostname, never the URL).
#
# Refuses when:
#   * DATABASE_URL, DEV_DATABASE_URL, or RATE_LIMIT_TEST_DATABASE_URL is set to a
#     non-loopback host (tests must use loopback-only databases; DEV_DATABASE_URL
#     overrides DATABASE_URL in development-like runs, so it is checked too), or
#   * APP_ENV, NODE_ENV, or VERCEL_ENV is "production".
#
# Unset URL variables are allowed: the tracked dummy `server/.env.test` then
# supplies the loopback target at test time (ambient env takes precedence when set).
# Pure string checks — this script never opens a network connection.

set -u

fail() {
  echo "[ensure-safe-test-target] REFUSING test run: $1" >&2
  exit 1
}

host_of() {
  node -e 'try { console.log(new URL(process.argv[1]).hostname); } catch { console.log(""); }' "$1"
}

for var in DATABASE_URL DEV_DATABASE_URL RATE_LIMIT_TEST_DATABASE_URL; do
  val="${!var:-}"
  [ -z "$val" ] && continue
  host="$(host_of "$val")"
  case "$host" in
    127.0.0.1|localhost|'::1') ;;
    *) fail "$var points at non-loopback host '${host:-unparseable}' (tests require loopback-only targets)" ;;
  esac
done

for var in APP_ENV NODE_ENV VERCEL_ENV; do
  val="${!var:-}"
  [ "$(printf '%s' "$val" | tr '[:upper:]' '[:lower:]')" = "production" ] \
    && fail "$var=production (tests must not run in production mode)"
done

echo "[ensure-safe-test-target] test database targets OK (loopback-only, non-production)."
