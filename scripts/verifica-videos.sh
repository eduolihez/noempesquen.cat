#!/usr/bin/env bash
# Comprueba cómo se sirven un MP4 y un .vtt: HEAD, Accept-Ranges, 206 con Range y tipo MIME.
# Uso: scripts/verifica-videos.sh <url-mp4> [url-vtt]
set -u
mp4="${1:?Uso: $0 <url-mp4> [url-vtt]}"
vtt="${2:-}"
fallos=0
ok() { echo "OK   $1"; }
ko() { echo "FALLO $1"; fallos=$((fallos + 1)); }

cab=$(curl -sI -m 20 "$mp4")
echo "$cab" | head -1 | grep -q " 200" && ok "HEAD del MP4 responde 200" || ko "HEAD del MP4 no responde 200"
echo "$cab" | grep -qi "^content-type: *video/mp4" && ok "Content-Type video/mp4" || ko "Content-Type del MP4 no es video/mp4"
echo "$cab" | grep -qi "^accept-ranges: *bytes" && ok "Accept-Ranges: bytes" || ko "falta Accept-Ranges: bytes"
codigo=$(curl -s -m 20 -o /dev/null -w "%{http_code}" -H "Range: bytes=0-99" "$mp4")
[ "$codigo" = "206" ] && ok "Range devuelve 206" || ko "Range devuelve $codigo (se esperaba 206)"
if [ -n "$vtt" ]; then
  tipo=$(curl -sI -m 20 "$vtt" | grep -i "^content-type:" | tr -d '\r')
  echo "$tipo" | grep -qi "text/vtt" && ok "VTT: $tipo" || ko "VTT sin text/vtt ($tipo)"
fi
exit $((fallos > 0))
