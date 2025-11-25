#!/bin/bash
# Backend Setup Script for Pensieve
# Sets up Node.js dependencies and configuration for backend API

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$SYSTEM_DIR")"

echo "=================================================="
echo "📦 Pensieve Backend Setup"
echo "=================================================="
echo ""

# Navigate to _system directory
cd "$SYSTEM_DIR"

# Install dependencies
echo "📥 Installing backend dependencies..."
if npm install; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo ""

# Build TypeScript
echo "🔨 Building TypeScript code..."
if npm run build; then
    echo "✅ TypeScript compiled successfully"
else
    echo "❌ Failed to compile TypeScript"
    exit 1
fi

echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env configuration file..."
    cat > .env << 'EOF'
# Vault Configuration
VAULT_PATH=../vault

# Language Settings
DEFAULT_LANGUAGE=zh

# Voice Settings
TTS_SCRIPT_PATH=./script/google_tts.sh
DEFAULT_TTS_VOICE_EN=en-GB-Standard-B
DEFAULT_TTS_VOICE_ZH=cmn-TW-Standard-B

# Web Server
WEB_PORT=3000
WEB_HOST=localhost

# Claude Code CLI
CLAUDE_CODE_MAX_CONCURRENT=3
CLAUDE_CODE_TIMEOUT=60000

# Journal Settings
JOURNAL_AUTO_CREATE=true
JOURNAL_DEFAULT_TEMPLATE=daily-reflection

# PARA Settings
AUTO_ARCHIVE_COMPLETED_PROJECTS=false
EOF
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "✅ Backend setup completed!"
echo ""
echo "To start the backend server:"
echo "  cd _system"
echo "  npm run serve"
echo ""
