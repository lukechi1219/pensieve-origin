#!/bin/bash
# Frontend Setup Script for Pensieve
# Sets up Node.js dependencies and configuration for web UI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$SYSTEM_DIR")"
WEB_UI_DIR="$PROJECT_ROOT/web-ui"

echo "=================================================="
echo "🎨 Pensieve Frontend Setup"
echo "=================================================="
echo ""

# Check if web-ui directory exists
if [ ! -d "$WEB_UI_DIR" ]; then
    echo "❌ web-ui directory not found at: $WEB_UI_DIR"
    exit 1
fi

# Navigate to web-ui directory
cd "$WEB_UI_DIR"

# Install dependencies
echo "📥 Installing frontend dependencies..."
if npm install; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env configuration file..."
    echo "VITE_API_URL=http://localhost:3000/api" > .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "✅ Frontend setup completed!"
echo ""
echo "To start the frontend dev server:"
echo "  cd web-ui"
echo "  npm run dev"
echo ""
