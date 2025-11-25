#!/bin/bash
# Pensieve Initialization Script
# One-command setup for the entire Pensieve second brain system

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$PROJECT_ROOT/_system/script"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║              🧠 Pensieve Initialization                ║"
echo "║         Second Brain Knowledge Management System       ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "This script will set up your Pensieve environment:"
echo "  1. ☁️  Google Cloud SDK (for Text-to-Speech)"
echo "  2. 📦 Backend dependencies and configuration"
echo "  3. 🎨 Frontend dependencies and configuration"
echo ""
echo -e "${YELLOW}Note: This requires Node.js 18+ and Homebrew${NC}"
echo ""
read -p "Continue with installation? (Y/n): " CONTINUE

if [[ "$CONTINUE" =~ ^[Nn]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher (current: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check Homebrew (only for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}❌ Homebrew is not installed${NC}"
        echo "Please install Homebrew from: https://brew.sh/"
        exit 1
    fi
    echo -e "${GREEN}✅ Homebrew $(brew --version | head -1)${NC}"
fi

echo ""

# Step 1: Google Cloud SDK
echo "=================================================="
echo "Step 1: Google Cloud SDK Setup"
echo "=================================================="
echo ""
echo -e "${BLUE}This will install Google Cloud SDK and configure Text-to-Speech API${NC}"
echo "You'll need a Google account and will be prompted to:"
echo "  - Authenticate with Google Cloud"
echo "  - Select/create a project"
echo "  - Enable Text-to-Speech API"
echo ""
read -p "Set up Google Cloud SDK now? (Y/n): " SETUP_GCLOUD

if [[ ! "$SETUP_GCLOUD" =~ ^[Nn]$ ]]; then
    chmod +x "$SCRIPT_DIR/setup-gcloud.sh"
    if "$SCRIPT_DIR/setup-gcloud.sh"; then
        echo -e "${GREEN}✅ Google Cloud SDK configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Google Cloud SDK setup incomplete${NC}"
        echo "You can run it later with: ./_system/script/setup-gcloud.sh"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping Google Cloud SDK setup${NC}"
    echo "You can run it later with: ./_system/script/setup-gcloud.sh"
fi

echo ""

# Step 2: Backend
echo "=================================================="
echo "Step 2: Backend Setup"
echo "=================================================="
echo ""

chmod +x "$SCRIPT_DIR/setup-backend.sh"
if "$SCRIPT_DIR/setup-backend.sh"; then
    echo -e "${GREEN}✅ Backend configured${NC}"
else
    echo -e "${RED}❌ Backend setup failed${NC}"
    exit 1
fi

echo ""

# Step 3: Frontend
echo "=================================================="
echo "Step 3: Frontend Setup"
echo "=================================================="
echo ""

chmod +x "$SCRIPT_DIR/setup-frontend.sh"
if "$SCRIPT_DIR/setup-frontend.sh"; then
    echo -e "${GREEN}✅ Frontend configured${NC}"
else
    echo -e "${RED}❌ Frontend setup failed${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║           🎉 Installation Complete! 🎉                 ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your Pensieve system is ready!${NC}"
echo ""
echo "📚 Next steps:"
echo ""
echo "  1. Start the backend server:"
echo -e "     ${BLUE}cd _system && npm run serve${NC}"
echo ""
echo "  2. Start the frontend (in a new terminal):"
echo -e "     ${BLUE}cd web-ui && npm run dev${NC}"
echo ""
echo "  3. Open your browser:"
echo -e "     ${BLUE}http://localhost:5173/${NC}"
echo ""
echo "📖 Documentation:"
echo "  - QUICKSTART.md - Quick start guide"
echo "  - CLAUDE.md - Project architecture"
echo "  - API_DOCUMENTATION.md - API reference"
echo "  - plan.md - CODE methodology (Chinese)"
echo ""
echo "🤖 Voice Agents:"
echo "  - English: 'Hey JARVIS'"
echo "  - Chinese: '老賈'"
echo ""
echo -e "${YELLOW}Tip: Run './init.sh' again anytime to reconfigure${NC}"
echo ""
