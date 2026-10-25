#!/usr/bin/env bash
# Refreshes everything that lists Cloudflare's IP ranges: the nginx real-IP file and the ufw rules that open
# 80/443 to Cloudflare only. Cloudflare rarely changes the list; run this every few months, from the repo root:
#
#   deploy/cloudflare-ips.sh            show the differences, change nothing
#   deploy/cloudflare-ips.sh --apply    rewrite deploy/nginx/cloudflare-realip.conf, then update the server
#
# Then commit deploy/nginx/cloudflare-realip.conf. Port 22 and every non-Cloudflare rule are never touched.
set -euo pipefail
HOST="${DEPLOY_HOST:-myserver}"
CONF="deploy/nginx/cloudflare-realip.conf"
cd "$(dirname "$0")/.."

# The files have no trailing newline: read each one separately
ranges="$(curl -fsS https://www.cloudflare.com/ips-v4; echo; curl -fsS https://www.cloudflare.com/ips-v6; echo)"
ranges="$(grep -E '^[0-9a-f.:]+/[0-9]+$' <<<"$ranges")"
n4="$(grep -c '\.' <<<"$ranges" || true)"; n6="$(grep -c ':' <<<"$ranges" || true)"
# A failed or truncated download must never close 80/443 for Cloudflare
(( n4 >= 10 && n6 >= 5 )) || { echo "Cloudflare list looks wrong (v4=$n4 v6=$n6), nothing changed" >&2; exit 1; }

new_conf="$(grep -vE '^(set_real_ip_from|real_ip_header)' "$CONF" | sed 's/(checked [0-9-]*)/(checked '"$(date +%F)"')/'
  sed 's/^/set_real_ip_from /; s/$/;/' <<<"$ranges"
  echo 'real_ip_header CF-Connecting-IP;')"
diff <(grep '^set_real_ip_from' "$CONF") <(grep '^set_real_ip_from' <<<"$new_conf") && { echo "No change in Cloudflare ranges."; exit 0; }
[[ "${1:-}" == "--apply" ]] || { echo "Ranges changed (above). Run with --apply to update."; exit 0; }

printf '%s\n' "$new_conf" > "$CONF"
scp -q "$CONF" "$HOST:/tmp/cloudflare-realip.conf"
ssh "$HOST" "RANGES='$ranges' bash -s" <<'EOF'
set -euo pipefail
F=/etc/nginx/conf.d/cloudflare-realip.conf
B="$F.bak-$(date +%Y%m%d-%H%M%S)"
cp -a "$F" "$B"
cp /tmp/cloudflare-realip.conf "$F"
nginx -t || { cp -a "$B" "$F"; echo "nginx -t failed, restored $B" >&2; exit 1; }
systemctl reload nginx
# Add the new ranges first, then remove the ones Cloudflare dropped: there is no moment without access
for r in $RANGES; do ufw allow proto tcp from "$r" to any port 80,443 comment cloudflare >/dev/null; done
ufw show added | grep "comment 'cloudflare'" | awk '{print $4}' | while read -r old; do
  grep -qxF "$old" <<<"$RANGES" || ufw delete allow from "$old" to any port 80,443 proto tcp
done
echo "cloudflare rules: $(ufw show added | grep -c "comment 'cloudflare'")"
EOF
