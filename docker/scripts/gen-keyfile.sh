#!/usr/bin/env bash
# Tạo keyfile cho replica set MongoDB (xác thực nội bộ giữa các node).
set -euo pipefail

target="${1:-$(dirname "$0")/../mongo/keyfile}"

if [[ -e "$target" ]]; then
  echo "Đã có $target, không ghi đè." >&2
  exit 0
fi

umask 077
openssl rand -base64 756 > "$target"
chmod 400 "$target"
echo "Đã tạo $target"
