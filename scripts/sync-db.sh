#!/usr/bin/env bash
# sync-db.sh — copy fresh opportunity.db to app/data/ and push to trigger Railway redeploy
# Usage: bash scripts/sync-db.sh
# Run from repo root after any pipeline update.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/data/opportunity.db"
DST="$REPO_ROOT/app/data/opportunity.db"

if [ ! -f "$SRC" ]; then
  echo "ERROR: $SRC not found. Run the pipeline first."
  exit 1
fi

echo "Copying $SRC → $DST"
cp "$SRC" "$DST"

cd "$REPO_ROOT"

if git diff --quiet app/data/opportunity.db 2>/dev/null && git ls-files --error-unmatch app/data/opportunity.db &>/dev/null; then
  echo "No changes in opportunity.db — nothing to push."
  exit 0
fi

git add app/data/opportunity.db
git commit -m "Data: sync opportunity.db $(date '+%Y-%m-%d %H:%M')"
git push

echo "Done. Railway will redeploy automatically."
