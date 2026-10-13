#!/usr/bin/env bash
# Deploy the latest main to the server: git pull, then rebuild and restart the container.
# The server pulls from GitHub, so local commits must be pushed first.
# SSH user, port and key come from the "loftools-server" entry in ~/.ssh/config.
set -euo pipefail

SSH_HOST="${LOFTOOLS_SSH_HOST:-loftools-server}"
REMOTE_DIR="/mnt/cache/appdata/loftools"

cd "$(dirname "$0")/.."
git fetch --quiet origin main
if [ -n "$(git log origin/main..HEAD --oneline)" ]; then
  echo "Warning: local commits not pushed to origin/main; the server won't get them:" >&2
  git log origin/main..HEAD --oneline >&2
fi

# BatchMode fails fast instead of hanging on a password prompt.
# Pull before taking the container down so a failed pull leaves the site running.
ssh -o BatchMode=yes "$SSH_HOST" "set -e
  cd '$REMOTE_DIR'
  git pull --ff-only
  docker compose down
  docker compose up -d --build
  git log -1 --oneline
  docker compose ps"
