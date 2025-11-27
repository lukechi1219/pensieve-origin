# Network Launcher Script Usage

## Quick Start

```bash
./start-network.sh
```

## What It Does

The `start-network.sh` script provides an interactive way to:

1. **Detect Network Interfaces** - Automatically finds all available IPv4 addresses
2. **Choose IP Address** - Let you select which IP to bind servers to
3. **Update Configurations** - Automatically updates:
   - `_system/.env` (backend config)
   - `web-ui/.env` (frontend API URL)
   - `web-ui/vite.config.ts` (dev server host)
4. **Build Backend** - Compiles TypeScript
5. **Start Both Servers** - Runs backend and frontend simultaneously

## IP Address Options

### 1. Network IP (e.g., 192.168.0.23)
- ✅ Accessible from other devices on the same network
- ✅ Accessible from your computer
- 📱 Perfect for mobile testing
- 🏠 Only works while connected to that network

**Use when:** You want to access Pensieve from your phone/tablet on the same WiFi

### 2. localhost
- ✅ Accessible only from your computer
- 🔒 Most secure (no network exposure)
- ⚡ Fastest (no network overhead)

**Use when:** You're only working on your computer

### 3. 0.0.0.0 (All Interfaces) ⭐ Recommended
- ✅ Accessible from all network interfaces
- ✅ Works with localhost, 127.0.0.1, and network IP
- ✅ Most flexible option
- ✅ Survives network changes

**Use when:** You want maximum flexibility

## Example Session

```bash
$ ./start-network.sh

╔════════════════════════════════════════╗
║   Pensieve Network Launcher           ║
╔════════════════════════════════════════╗

🔍 Detecting network interfaces...

Available IP addresses:

  [1] 192.168.0.23 (network accessible)
  [2] localhost (local access only)
  [3] 0.0.0.0 (all interfaces - recommended for network access)

Select IP address [1-3]: 3

✓ Selected IP: 0.0.0.0

🔧 Updating configuration files...
✓ Updated _system/.env
✓ Updated web-ui/.env
✓ Updated web-ui/vite.config.ts

🔨 Building backend...
✓ Backend built successfully

╔════════════════════════════════════════╗
║   Configuration Complete               ║
╚════════════════════════════════════════╝

Access URLs:
  Frontend (Local):   http://localhost:5173/
  Frontend (Network): http://192.168.0.23:5173/
  Backend (Local):    http://localhost:3000/
  Backend (Network):  http://192.168.0.23:3000/

✓ Accessible from all network devices

Start servers now? [Y/n]: y

🚀 Starting servers...

╔════════════════════════════════════════╗
║   Press Ctrl+C to stop all servers     ║
╚════════════════════════════════════════╝

📡 Starting backend server...
✓ Backend running (PID: 12345)
🎨 Starting frontend server...
✓ Frontend running (PID: 12346)

╔════════════════════════════════════════╗
║   Both servers are running!            ║
╚════════════════════════════════════════╝

🌐 Open your browser:
   Local:   http://localhost:5173/
   Network: http://192.168.0.23:5173/

📋 Logs:
   Backend:  tail -f backend.log
   Frontend: tail -f frontend.log

Press Ctrl+C to stop all servers
```

## Stopping Servers

Press `Ctrl+C` in the terminal where the script is running. This will gracefully stop both servers.

## Log Files

The script creates two log files in the project root:

- `backend.log` - Backend server output
- `frontend.log` - Frontend server output

View logs in real-time:
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

These files are automatically ignored by git (`.gitignore`).

## Troubleshooting

### No Network Interfaces Detected

**Symptom:** Only "localhost" and "0.0.0.0" options shown

**Cause:** Not connected to any network (WiFi/Ethernet)

**Solution:** Connect to a network or choose "localhost" for local-only access

### Can't Connect from Other Devices

**Checklist:**
1. ✅ Both devices on same WiFi network?
2. ✅ Firewall allowing ports 3000 and 5173?
3. ✅ Selected correct IP (not localhost)?
4. ✅ Servers actually running?

**Test connectivity:**
```bash
# From your computer
ping 192.168.0.23

# Should reply
```

### Port Already in Use

**Symptom:** Backend or frontend fails to start

**Cause:** Another process is using port 3000 or 5173

**Solution:**
```bash
# Find what's using port 3000
lsof -i :3000

# Find what's using port 5173
lsof -i :5173

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

### Wrong IP Address

**If your IP changed** (e.g., reconnected to WiFi with DHCP):

1. Run the script again
2. It will detect the new IP
3. Configuration will be updated automatically

## Manual Configuration

If you prefer to configure manually instead of using the script:

1. **Backend** (`_system/.env`):
   ```env
   WEB_HOST=0.0.0.0
   ALLOWED_ORIGINS=http://localhost:5173,http://192.168.0.23:5173
   ```

2. **Frontend** (`web-ui/.env`):
   ```env
   VITE_API_URL=http://192.168.0.23:3000/api
   ```

3. **Vite Config** (`web-ui/vite.config.ts`):
   ```typescript
   server: {
     host: '0.0.0.0',
     port: 5173,
   }
   ```

4. **Rebuild and start:**
   ```bash
   cd _system && npm run build
   # Then start servers manually in two terminals
   ```

## Advanced Usage

### Skip Server Start

If you only want to update configuration without starting servers:

```bash
./start-network.sh
# When prompted "Start servers now? [Y/n]:", type 'n'
```

Then start manually:
```bash
# Terminal 1
cd _system && npm run serve

# Terminal 2
cd web-ui && npm run dev
```

### Script Internals

The script performs these steps:

1. Detects IPv4 addresses using `ifconfig` (macOS) or `hostname -I` (Linux)
2. Prompts user for selection
3. Updates configuration files using `sed`
4. Runs `npm run build` in backend directory
5. Starts servers as background processes
6. Monitors PIDs and logs output
7. Handles Ctrl+C to kill all processes gracefully

## Platform Support

- ✅ **macOS** - Fully tested
- ✅ **Linux** - Should work (uses `hostname -I`)
- ❌ **Windows** - Not supported (use WSL or manual configuration)

## Related Documentation

- [Local Network Setup Guide](LOCAL_NETWORK_SETUP.md) - Detailed network setup documentation
- [Quick Start Guide](QUICKSTART.md) - Initial setup instructions
- [API Documentation](API_DOCUMENTATION.md) - Backend API reference

---

**Last Updated:** 2025-11-28
