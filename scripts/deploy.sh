#!/usr/bin/env bash
# Deploys the site to the server as a new release (atomic symlink switch).
#
#   scripts/deploy.sh             full deploy
#   scripts/deploy.sh --dry-run   build + checks + rsync dry run; changes nothing on the server
#
# Steps: install → build:release → checks and tests → upload to releases/<timestamp>/ → health check of the new
# release on the server's localhost-only check server → switch `current` → keep the newest 5 releases.
# Server layout: /var/www/portfolio/{releases/<ts>/, current → releases/<ts>, next → releases/<ts>}
# No secrets here: the connection is your own `ssh myserver` (key-based).
set -euo pipefail

HOST="${DEPLOY_HOST:-myserver}"
BASE="/var/www/portfolio"
KEEP=5
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

cd "$(dirname "$0")/.."
step() { printf '\n== %s\n' "$*"; }

# GNU rsync only: macOS ships openrsync, which transfers to a GNU rsync server at ~1 KB/s (seen on the first deploy).
RSYNC_BIN="${RSYNC_BIN:-}"
if [[ -z "$RSYNC_BIN" ]]; then
  for c in /opt/homebrew/bin/rsync /usr/local/bin/rsync rsync; do
    command -v "$c" >/dev/null 2>&1 && ! "$c" --version 2>&1 | grep -qi openrsync && { RSYNC_BIN="$c"; break; }
  done
fi
[[ -n "$RSYNC_BIN" ]] || { echo "GNU rsync not found (macOS openrsync is too slow against the server). Install it: brew install rsync" >&2; exit 1; }

step "Install"
npm ci

step "Release build (fails on [NEEDS INPUT] or private data)"
npm run build:release

step "Checks and tests"
npm run check
npx playwright test --reporter=line
npm run links

TS="$(date -u +%Y%m%dT%H%M%SZ)"
REL="$BASE/releases/$TS"
# Upload into a hidden folder and rename it only when the transfer is complete: a broken upload can never look
# like a release (rollback.sh and the cleanup only see timestamped names).
INCOMING="$BASE/releases/.incoming-$TS"
PREV="$(ssh "$HOST" "readlink -e '$BASE/current' 2>/dev/null || true")"   # -e: empty if there is no live release yet
# Unchanged files are hard-linked from the live release, so uploads are small. The target is always a new, empty
# folder: no --delete is needed, and nothing outside the release can be removed.
LINK_DEST=()
[[ -n "$PREV" ]] && LINK_DEST=(--link-dest="$PREV")
# ${arr[@]+…} form: macOS bash 3.2 treats an empty array as unbound under set -u.
RSYNC=("$RSYNC_BIN" -a --chmod=D755,F644 ${LINK_DEST[@]+"${LINK_DEST[@]}"} dist/ "$HOST:$INCOMING/")

if (( DRY_RUN )); then
  step "rsync dry run → $HOST:$INCOMING (nothing is changed)"
  "${RSYNC[@]}" --dry-run --itemize-changes --stats
  exit 0
fi

step "Upload → $HOST:$INCOMING"
ssh "$HOST" "test ! -e '$REL' && test ! -e '$INCOMING' && mkdir -p '$INCOMING'"
"${RSYNC[@]}" --stats
ssh "$HOST" "mv -T '$INCOMING' '$REL'"   # complete: becomes a release

step "Health check of the new release (http://127.0.0.1:8080 on the server)"
ssh "$HOST" bash -s -- "$BASE" "$REL" <<'CHECK'
set -euo pipefail
BASE="$1"; REL="$2"
ln -sfn "$REL" "$BASE/next"
code() { curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080$1"; }
fail=0
expect() { local got; got="$(code "$1")"; if [[ "$got" == "$2" ]]; then echo "ok   $2  $1"; else echo "FAIL $1 → $got (expected $2)"; fail=1; fi; }
expect /                 200
expect /az/              200
expect /work/milly/      200
expect /az/work/milly/   200
expect /work/milly       301
expect /nope/            404
expect /az/nope/         404
curl -s http://127.0.0.1:8080/az/nope/ | grep -q 'Səhifə tapılmadı' && echo "ok   Azerbaijani 404 page" || { echo "FAIL /az/nope/ is not the Azerbaijani 404"; fail=1; }
curl -s http://127.0.0.1:8080/ | grep -q 'http-equiv="content-security-policy"' && echo "ok   CSP meta present" || { echo "FAIL no CSP meta"; fail=1; }
exit "$fail"
CHECK

step "Go live: switch current → $TS"
ssh "$HOST" "ln -sfn '$REL' '$BASE/current.tmp' && mv -T '$BASE/current.tmp' '$BASE/current' && readlink '$BASE/current'"

step "Keep the newest $KEEP releases"
ssh "$HOST" bash -s -- "$BASE" "$KEEP" <<'CLEAN'
set -euo pipefail
BASE="$1"; KEEP="$2"
live="$(readlink -f "$BASE/current")"
cd "$BASE/releases"
# timestamped names sort chronologically; never remove the live release
ls -1d 20*Z 2>/dev/null | sort -r | tail -n +"$((KEEP + 1))" | while read -r old; do
  [[ "$BASE/releases/$old" == "$live" ]] && continue
  echo "removing old release $old"
  rm -rf -- "$BASE/releases/$old"
done
CLEAN

step "Done: $TS is live (previous: ${PREV:-none}). Roll back with scripts/rollback.sh"
