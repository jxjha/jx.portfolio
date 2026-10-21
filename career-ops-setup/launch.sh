#!/usr/bin/env bash
set -euo pipefail

CAREER_OPS_DIR="$HOME/career-ops"

if [ ! -d "$CAREER_OPS_DIR" ]; then
  echo ""
  echo "career-ops is not installed yet."
  echo "Running first-time setup..."
  echo ""
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  bash "$SCRIPT_DIR/setup.sh"
fi

cd "$CAREER_OPS_DIR"
echo ""
echo "Starting career-ops web UI..."
echo "Open http://localhost:3000 in your browser."
echo ""
npm run ui
