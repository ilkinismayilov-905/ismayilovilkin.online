#!/usr/bin/env bash
# Points the live site back to an earlier release (atomic symlink switch; nothing is deleted).
#
#   scripts/rollback.sh               previous release (the one before the live one)
#   scripts/rollback.sh <timestamp>   a specific release, e.g. 20261024T150000Z
#   scripts/rollback.sh --list        show releases and which one is live
set -euo pipefail

HOST="${DEPLOY_HOST:-myserver}"
BASE="/var/www/portfolio"

ssh "$HOST" bash -s -- "$BASE" "${1:-}" <<'ROLLBACK'
set -euo pipefail
BASE="$1"; WANT="${2:-}"   # ssh drops an empty argument, so $2 may be missing
cd "$BASE/releases"
live="$(basename "$(readlink -f "$BASE/current")")"
mapfile -t all < <(ls -1d 20*Z 2>/dev/null | sort)

if [[ "$WANT" == "--list" ]]; then
  for r in "${all[@]}"; do [[ "$r" == "$live" ]] && echo "$r  ← live" || echo "$r"; done
  exit 0
fi

if [[ -z "$WANT" ]]; then
  target=""
  for r in "${all[@]}"; do [[ "$r" == "$live" ]] && break; target="$r"; done
  [[ -n "$target" ]] || { echo "No release older than the live one ($live)." >&2; exit 1; }
else
  [[ "$WANT" =~ ^20[0-9]{6}T[0-9]{6}Z$ && -d "$WANT" ]] || { echo "No such release: $WANT" >&2; exit 1; }
  target="$WANT"
fi

ln -sfn "$BASE/releases/$target" "$BASE/current.tmp"
mv -T "$BASE/current.tmp" "$BASE/current"
echo "live: $target (was $live)"
ROLLBACK
