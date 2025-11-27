#!/bin/bash

# Pensieve Network Launcher
# Detects available IPv4 addresses and starts servers on selected IP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/_system"
FRONTEND_DIR="${SCRIPT_DIR}/web-ui"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Pensieve Network Launcher           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Function to get IPv4 addresses
get_ipv4_addresses() {
    # Get all IPv4 addresses excluding loopback
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}'
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        hostname -I | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | grep -v "127.0.0.1"
    else
        echo "Unsupported OS: $OSTYPE" >&2
        exit 1
    fi
}

# Get available IP addresses
echo -e "${YELLOW}🔍 Detecting network interfaces...${NC}"
IPS=($(get_ipv4_addresses))

# Always add localhost option
IPS+=("localhost")
IPS+=("0.0.0.0")

if [ ${#IPS[@]} -eq 2 ]; then
    # Only localhost and 0.0.0.0 available
    echo -e "${YELLOW}⚠️  No network interfaces detected (not connected to network)${NC}"
    echo ""
fi

# Display available IP addresses
echo -e "${GREEN}Available IP addresses:${NC}"
echo ""
for i in "${!IPS[@]}"; do
    ip="${IPS[$i]}"
    if [ "$ip" == "localhost" ]; then
        echo -e "  ${BLUE}[$((i+1))]${NC} $ip ${YELLOW}(local access only)${NC}"
    elif [ "$ip" == "0.0.0.0" ]; then
        echo -e "  ${BLUE}[$((i+1))]${NC} $ip ${GREEN}(all interfaces - recommended for network access)${NC}"
    else
        echo -e "  ${BLUE}[$((i+1))]${NC} $ip ${GREEN}(network accessible)${NC}"
    fi
done
echo ""

# Prompt user to select IP
while true; do
    echo -n -e "${YELLOW}Select IP address [1-${#IPS[@]}]: ${NC}"
    read -r choice

    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#IPS[@]} ]; then
        SELECTED_IP="${IPS[$((choice-1))]}"
        break
    else
        echo -e "${RED}Invalid choice. Please enter a number between 1 and ${#IPS[@]}${NC}"
    fi
done

echo ""
echo -e "${GREEN}✓ Selected IP: ${SELECTED_IP}${NC}"
echo ""

# Determine display IP for URLs
if [ "$SELECTED_IP" == "0.0.0.0" ]; then
    # If 0.0.0.0, use the first actual IP for display
    DISPLAY_IP="${IPS[0]}"
    if [ "$DISPLAY_IP" == "localhost" ] && [ ${#IPS[@]} -gt 2 ]; then
        # If first is localhost, try second
        DISPLAY_IP="${IPS[1]}"
    fi
    echo -e "${BLUE}ℹ️  Server will listen on all interfaces (0.0.0.0)${NC}"
    echo -e "${BLUE}ℹ️  Access URL will use: ${DISPLAY_IP}${NC}"
else
    DISPLAY_IP="$SELECTED_IP"
fi

# Update configuration files
echo -e "${YELLOW}🔧 Updating configuration files...${NC}"

# Update backend .env
if [ -f "${BACKEND_DIR}/.env" ]; then
    # Update WEB_HOST
    if grep -q "^WEB_HOST=" "${BACKEND_DIR}/.env"; then
        sed -i.bak "s|^WEB_HOST=.*|WEB_HOST=${SELECTED_IP}|g" "${BACKEND_DIR}/.env"
    else
        echo "WEB_HOST=${SELECTED_IP}" >> "${BACKEND_DIR}/.env"
    fi

    # Update ALLOWED_ORIGINS
    CORS_ORIGINS="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    if [ "$SELECTED_IP" != "localhost" ] && [ "$SELECTED_IP" != "127.0.0.1" ]; then
        CORS_ORIGINS="${CORS_ORIGINS},http://${DISPLAY_IP}:5173,http://${DISPLAY_IP}:3000"
    fi

    if grep -q "^ALLOWED_ORIGINS=" "${BACKEND_DIR}/.env"; then
        sed -i.bak "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${CORS_ORIGINS}|g" "${BACKEND_DIR}/.env"
    else
        echo "ALLOWED_ORIGINS=${CORS_ORIGINS}" >> "${BACKEND_DIR}/.env"
    fi

    echo -e "${GREEN}✓ Updated ${BACKEND_DIR}/.env${NC}"
else
    echo -e "${RED}✗ Backend .env not found${NC}"
    exit 1
fi

# Update frontend .env
if [ -f "${FRONTEND_DIR}/.env" ]; then
    API_URL="http://${DISPLAY_IP}:3000/api"

    if grep -q "^VITE_API_URL=" "${FRONTEND_DIR}/.env"; then
        sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=${API_URL}|g" "${FRONTEND_DIR}/.env"
    else
        echo "VITE_API_URL=${API_URL}" >> "${FRONTEND_DIR}/.env"
    fi

    echo -e "${GREEN}✓ Updated ${FRONTEND_DIR}/.env${NC}"
else
    echo -e "${RED}✗ Frontend .env not found${NC}"
    exit 1
fi

# Update vite.config.ts
VITE_CONFIG="${FRONTEND_DIR}/vite.config.ts"
if [ -f "${VITE_CONFIG}" ]; then
    # Check if server config exists
    if ! grep -q "server:" "${VITE_CONFIG}"; then
        # Add server config if not exists
        sed -i.bak "s|plugins: \[|plugins: [|; /plugins: \[/a\\
  server: {\\
    host: '${SELECTED_IP}',\\
    port: 5173,\\
  }," "${VITE_CONFIG}"
    else
        # Update existing host
        sed -i.bak "s|host: '[^']*'|host: '${SELECTED_IP}'|g" "${VITE_CONFIG}"
    fi
    echo -e "${GREEN}✓ Updated ${VITE_CONFIG}${NC}"
fi

echo ""
echo -e "${YELLOW}🔨 Building backend...${NC}"
cd "${BACKEND_DIR}"
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓ Backend built successfully${NC}"
echo ""

# Display access information
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Configuration Complete               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
if [ "$SELECTED_IP" == "localhost" ]; then
    echo -e "  ${BLUE}Frontend:${NC} http://localhost:5173/"
    echo -e "  ${BLUE}Backend:${NC}  http://localhost:3000/"
    echo ""
    echo -e "${YELLOW}⚠️  Local access only (not accessible from network)${NC}"
elif [ "$SELECTED_IP" == "0.0.0.0" ]; then
    echo -e "  ${BLUE}Frontend (Local):${NC}   http://localhost:5173/"
    echo -e "  ${BLUE}Frontend (Network):${NC} http://${DISPLAY_IP}:5173/"
    echo -e "  ${BLUE}Backend (Local):${NC}    http://localhost:3000/"
    echo -e "  ${BLUE}Backend (Network):${NC}  http://${DISPLAY_IP}:3000/"
    echo ""
    echo -e "${GREEN}✓ Accessible from all network devices${NC}"
else
    echo -e "  ${BLUE}Frontend (Local):${NC}   http://localhost:5173/"
    echo -e "  ${BLUE}Frontend (Network):${NC} http://${DISPLAY_IP}:5173/"
    echo -e "  ${BLUE}Backend:${NC}  http://${DISPLAY_IP}:3000/"
    echo ""
    echo -e "${GREEN}✓ Network accessible${NC}"
fi
echo ""

# Cleanup backup files
rm -f "${BACKEND_DIR}/.env.bak" "${FRONTEND_DIR}/.env.bak" "${VITE_CONFIG}.bak"

# Ask if user wants to start servers now
echo -n -e "${YELLOW}Start servers now? [Y/n]: ${NC}"
read -r start_now

if [[ ! "$start_now" =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${GREEN}🚀 Starting servers...${NC}"
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Press Ctrl+C to stop all servers     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    # Trap Ctrl+C to kill all background processes
    trap 'echo ""; echo -e "${YELLOW}🛑 Stopping servers...${NC}"; kill $(jobs -p) 2>/dev/null; exit 0' INT TERM

    # Start backend in background
    echo -e "${YELLOW}📡 Starting backend server...${NC}"
    cd "${BACKEND_DIR}"
    npm run serve > "${SCRIPT_DIR}/backend.log" 2>&1 &
    BACKEND_PID=$!

    # Wait a bit for backend to start
    sleep 2

    # Check if backend is running
    if ! ps -p $BACKEND_PID > /dev/null; then
        echo -e "${RED}✗ Backend failed to start. Check backend.log for details${NC}"
        cat "${SCRIPT_DIR}/backend.log"
        exit 1
    fi

    echo -e "${GREEN}✓ Backend running (PID: $BACKEND_PID)${NC}"

    # Start frontend in background
    echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
    cd "${FRONTEND_DIR}"
    npm run dev > "${SCRIPT_DIR}/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # Wait a bit for frontend to start
    sleep 3

    # Check if frontend is running
    if ! ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${RED}✗ Frontend failed to start. Check frontend.log for details${NC}"
        cat "${SCRIPT_DIR}/frontend.log"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi

    echo -e "${GREEN}✓ Frontend running (PID: $FRONTEND_PID)${NC}"
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Both servers are running!            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$SELECTED_IP" == "localhost" ]; then
        echo -e "${GREEN}🌐 Open your browser:${NC} http://localhost:5173/"
    elif [ "$SELECTED_IP" == "0.0.0.0" ]; then
        echo -e "${GREEN}🌐 Open your browser:${NC}"
        echo -e "   ${BLUE}Local:${NC}   http://localhost:5173/"
        echo -e "   ${BLUE}Network:${NC} http://${DISPLAY_IP}:5173/"
    else
        echo -e "${GREEN}🌐 Open your browser:${NC}"
        echo -e "   ${BLUE}Local:${NC}   http://localhost:5173/"
        echo -e "   ${BLUE}Network:${NC} http://${DISPLAY_IP}:5173/"
    fi

    echo ""
    echo -e "${YELLOW}📋 Logs:${NC}"
    echo -e "   ${BLUE}Backend:${NC}  tail -f ${SCRIPT_DIR}/backend.log"
    echo -e "   ${BLUE}Frontend:${NC} tail -f ${SCRIPT_DIR}/frontend.log"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

    # Wait for background processes
    wait
else
    echo ""
    echo -e "${BLUE}ℹ️  Configuration saved. Start servers manually:${NC}"
    echo ""
    echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
    echo "  cd _system && npm run serve"
    echo ""
    echo -e "${YELLOW}Terminal 2 (Frontend):${NC}"
    echo "  cd web-ui && npm run dev"
    echo ""
fi
