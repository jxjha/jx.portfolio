#!/usr/bin/env bash
set -euo pipefail

# career-ops setup script for Janmesh Jha
# Run this once to get career-ops fully configured with your profile.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$HOME/career-ops"

echo ""
echo "=== career-ops setup for Janmesh Jha ==="
echo ""

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Install it from https://nodejs.org (v22+ recommended)"
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 20 ]; then
  echo "WARNING: Node.js v$NODE_VER detected. v22+ is recommended."
fi

# 2. Clone career-ops
if [ -d "$TARGET_DIR" ]; then
  echo "career-ops directory already exists at $TARGET_DIR"
  echo "Updating config files only..."
else
  echo "Step 1/4: Cloning career-ops..."
  npx @santifer/career-ops init 2>&1 || {
    echo "npx init failed, trying git clone..."
    git clone https://github.com/career-ops-hq/career-ops.git "$TARGET_DIR"
    cd "$TARGET_DIR" && npm install
  }
fi

cd "$TARGET_DIR"

# 3. Copy personalized config files
echo "Step 2/4: Installing your personalized profile..."

cp "$SCRIPT_DIR/cv.md" "$TARGET_DIR/cv.md"
echo "  -> cv.md (your CV in markdown)"

cp "$SCRIPT_DIR/article-digest.md" "$TARGET_DIR/article-digest.md"
echo "  -> article-digest.md (proof points & evidence)"

mkdir -p "$TARGET_DIR/config"
cp "$SCRIPT_DIR/profile.yml" "$TARGET_DIR/config/profile.yml"
echo "  -> config/profile.yml (target roles, compensation, location)"

cp "$SCRIPT_DIR/_profile.md" "$TARGET_DIR/modes/_profile.md"
echo "  -> modes/_profile.md (archetype targeting & narrative)"

# 4. Copy portals template if not present
if [ ! -f "$TARGET_DIR/portals.yml" ]; then
  cp "$TARGET_DIR/templates/portals.example.yml" "$TARGET_DIR/portals.yml"
  echo "  -> portals.yml (100+ company portals for scanning)"
fi

# 5. Install Playwright for PDF generation
echo "Step 3/4: Installing Playwright chromium for PDF generation..."
npx playwright install chromium 2>&1 || {
  echo "WARNING: Playwright chromium install failed."
  echo "You can still use career-ops for evaluations."
  echo "Run 'npx playwright install chromium' manually later for PDF support."
}

# 6. Run doctor
echo "Step 4/4: Running health check..."
echo ""
npm run doctor 2>&1 || true

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To start using career-ops:"
echo ""
echo "  cd $TARGET_DIR"
echo "  claude"
echo ""
echo "Then paste any job URL or description to evaluate it."
echo "Type /career-ops to see all available commands."
echo ""
