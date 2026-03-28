#!/usr/bin/env bash
# run-pipeline.sh — full automatic pipeline cycle
# Runs every step in order; safe to re-run at any time.
# Log: scripts/pipeline.log (appended each run)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/../app"
LOG="$SCRIPT_DIR/pipeline.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

log "=== Pipeline run start ==="

cd "$APP_DIR"

log "1/6  ingest-megatrends"
npm run pipeline:ingest-megatrends >> "$LOG" 2>&1

log "2/6  extract-megatrends"
npm run pipeline:extract-megatrends >> "$LOG" 2>&1

log "3/6  normalize-megatrends"
npm run pipeline:normalize-megatrends >> "$LOG" 2>&1

log "4/6  score-megatrends"
npm run pipeline:score-megatrends >> "$LOG" 2>&1

log "5/6  dedup-megatrends"
npm run pipeline:dedup-megatrends >> "$LOG" 2>&1

log "6/6  confirm-megatrends"
npm run pipeline:confirm-megatrends >> "$LOG" 2>&1

log "=== Pipeline run complete ==="
