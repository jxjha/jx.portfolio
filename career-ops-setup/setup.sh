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

# 7. Install web UI dependencies
echo "Step 5/5: Installing web UI..."
cd "$TARGET_DIR/web" && npm install 2>&1 || {
  echo "WARNING: Web UI install failed. CLI still works."
}

# 8. Create desktop launcher folder
DESKTOP_DIR=""
if [ -d "$HOME/Desktop" ]; then
  DESKTOP_DIR="$HOME/Desktop"
elif [ -d "$HOME/Schreibtisch" ]; then
  DESKTOP_DIR="$HOME/Schreibtisch"
fi

if [ -n "$DESKTOP_DIR" ]; then
  LAUNCHER_DIR="$DESKTOP_DIR/career-ops"
  mkdir -p "$LAUNCHER_DIR"

  cat > "$LAUNCHER_DIR/Start career-ops.command" << 'LAUNCHER'
#!/usr/bin/env bash
cd "$HOME/career-ops"
echo ""
echo "Starting career-ops web UI..."
echo "Opening http://localhost:3000 ..."
echo ""
npm run ui &
sleep 3
open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null || echo "Open http://localhost:3000 in your browser"
wait
LAUNCHER
  chmod +x "$LAUNCHER_DIR/Start career-ops.command"

  cat > "$LAUNCHER_DIR/Start career-ops.bat" << 'BATFILE'
@echo off
title career-ops
cd /d "%USERPROFILE%\career-ops"
echo Starting career-ops web UI...
echo Opening http://localhost:3000 ...
start http://localhost:3000
npm run ui
BATFILE

  cat > "$LAUNCHER_DIR/Start CLI.command" << 'CLILAUNCHER'
#!/usr/bin/env bash
cd "$HOME/career-ops"
echo "Starting career-ops CLI..."
echo "Paste any job URL to evaluate it."
echo "Type /career-ops for all commands."
echo ""
claude
CLILAUNCHER
  chmod +x "$LAUNCHER_DIR/Start CLI.command"

  echo ""
  echo "Desktop launcher created at: $LAUNCHER_DIR"
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Two ways to use career-ops:"
echo ""
echo "  1. WEB UI (browser dashboard):"
echo "     cd $TARGET_DIR && npm run ui"
echo "     Then open http://localhost:3000"
echo ""
echo "  2. CLI (paste jobs directly):"
echo "     cd $TARGET_DIR && claude"
echo ""
if [ -n "$DESKTOP_DIR" ]; then
  echo "  Or use the launchers on your Desktop/career-ops folder."
  echo ""
fi
