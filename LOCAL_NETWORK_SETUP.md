# Local Network Setup Guide

This guide explains how to run Pensieve on your local network (192.168.0.23) so other devices can access it.

---

## ✅ Configuration Applied

The following configurations have been set up for local network access:

### Backend Configuration (`_system/.env`)

```env
# Web Server - Listen on all interfaces
WEB_PORT=3000
WEB_HOST=0.0.0.0

# CORS Settings - Allow local network access
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://192.168.0.23:5173,http://192.168.0.23:3000
```

**Key Changes**:
- `WEB_HOST=0.0.0.0` - Binds server to all network interfaces (not just localhost)
- `ALLOWED_ORIGINS` - Added `http://192.168.0.23:5173` and `http://192.168.0.23:3000` to CORS whitelist

### Frontend Configuration (`web-ui/.env`)

```env
VITE_API_URL=http://192.168.0.23:3000/api
```

**Key Changes**:
- API URL points to local network IP instead of localhost

### Vite Configuration (`web-ui/vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
  },
})
```

---

## 🚀 Starting the Servers

### Terminal 1: Start Backend API

```bash
cd _system
npm run serve
```

**Expected Output**:
```
🚀 Pensieve API server running on http://0.0.0.0:3000
📂 Vault: ../vault
```

### Terminal 2: Start Frontend Dev Server

```bash
cd web-ui
npm run dev
```

**Expected Output**:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.0.23:5173/
```

---

## 🌐 Accessing the Application

### From the Host Machine (Your Computer)

- **Frontend**: http://localhost:5173/
- **Frontend (Network)**: http://192.168.0.23:5173/
- **Backend API**: http://192.168.0.23:3000/api

### From Other Devices on the Same Network

- **Frontend**: http://192.168.0.23:5173/
- **Backend API**: http://192.168.0.23:3000/api

**Examples**:
- **iPhone/iPad**: Open Safari and navigate to `http://192.168.0.23:5173/`
- **Another Computer**: Open any browser and navigate to `http://192.168.0.23:5173/`
- **Android Device**: Open Chrome and navigate to `http://192.168.0.23:5173/`

---

## 🔍 Verifying the Setup

### 1. Check Backend is Running

```bash
# From your computer
curl http://192.168.0.23:3000/health

# Expected response:
{"status":"ok","timestamp":"2025-11-28T..."}
```

### 2. Check Frontend is Accessible

```bash
# From your computer
curl -I http://192.168.0.23:5173/

# Expected response:
HTTP/1.1 200 OK
```

### 3. Check from Another Device

Open a browser on another device and navigate to:
```
http://192.168.0.23:5173/
```

You should see the Pensieve dashboard.

---

## 🔧 Troubleshooting

### Issue: "Connection Refused" from Other Devices

**Possible Causes**:
1. **Firewall Blocking**: Your firewall may be blocking ports 3000 and 5173

**Solution**:
```bash
# macOS: Allow ports through firewall
# System Preferences > Security & Privacy > Firewall > Firewall Options
# Add Node.js and allow incoming connections

# Alternative: Temporarily disable firewall for testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

### Issue: "CORS Error" in Browser Console

**Symptom**: Browser shows CORS policy error

**Solution**: Verify the ALLOWED_ORIGINS includes your access URL:

```bash
# Check current CORS settings
cat _system/.env | grep ALLOWED_ORIGINS

# Should include:
http://192.168.0.23:5173,http://192.168.0.23:3000
```

### Issue: Wrong IP Address

**If your local IP changes** (e.g., from 192.168.0.23 to 192.168.0.45):

1. Check your current IP:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

2. Update configurations:
```bash
# Update backend CORS
nano _system/.env
# Change ALLOWED_ORIGINS to include new IP

# Update frontend API URL
nano web-ui/.env
# Change VITE_API_URL to new IP

# Rebuild backend
cd _system && npm run build

# Restart both servers
```

### Issue: "Cannot Access from Mobile Device"

**Checklist**:
- ✅ Both devices on same WiFi network
- ✅ Firewall allows incoming connections
- ✅ Backend running on 0.0.0.0 (not localhost)
- ✅ Frontend running with `host: '0.0.0.0'`
- ✅ Mobile device can ping 192.168.0.23

**Test Connectivity**:
```bash
# From your computer - check what IP to use
ifconfig | grep "inet "

# From mobile device - ping the server
# (Use a network utility app)
ping 192.168.0.23
```

---

## 🔐 Security Considerations

### Local Network Only

This configuration is designed for **local network access only**. Do not expose these ports to the internet without proper security measures.

**Why?**:
- No authentication/authorization implemented yet
- HTTP (not HTTPS) - unencrypted traffic
- Development mode enabled (verbose errors)

### Production Deployment

For internet-facing deployment, you should:

1. **Enable HTTPS** with valid SSL certificates
2. **Add Authentication** (JWT, OAuth, etc.)
3. **Use Reverse Proxy** (Nginx, Caddy)
4. **Enable Rate Limiting**
5. **Set NODE_ENV=production**
6. **Build Frontend** (`npm run build`) instead of dev server

---

## 📱 Mobile Access Tips

### Save as Home Screen App (iOS)

1. Open `http://192.168.0.23:5173/` in Safari
2. Tap Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Name it "Pensieve"
5. Tap "Add"

Now you can launch Pensieve like a native app!

### Add to Home Screen (Android)

1. Open `http://192.168.0.23:5173/` in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen"
4. Name it "Pensieve"
5. Tap "Add"

---

## 🔄 Reverting to Localhost

If you want to revert back to localhost-only access:

### Backend (`_system/.env`)
```env
WEB_HOST=localhost
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`web-ui/.env`)
```env
VITE_API_URL=http://localhost:3000/api
```

### Vite Config (`web-ui/vite.config.ts`)
```typescript
server: {
  host: 'localhost',
  port: 5173,
},
```

Then rebuild and restart:
```bash
cd _system && npm run build
# Restart both servers
```

---

## 📊 Network Diagram

```
┌─────────────────────────────────────────┐
│         Local Network (WiFi)            │
│         192.168.0.0/24                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Host Machine (192.168.0.23)    │  │
│  │                                   │  │
│  │  Backend  :3000  (0.0.0.0)       │  │
│  │  Frontend :5173  (0.0.0.0)       │  │
│  └───────────────────────────────────┘  │
│              ▲                          │
│              │ HTTP Requests            │
│              │                          │
│  ┌───────────┴───────────────┐          │
│  │   Mobile Device           │          │
│  │   (iPhone/Android)        │          │
│  │   192.168.0.xxx           │          │
│  │                           │          │
│  │   Browser:                │          │
│  │   http://192.168.0.23:5173│          │
│  └───────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ Quick Reference

| Component | URL | Access |
|-----------|-----|--------|
| Frontend (Local) | http://localhost:5173 | Host only |
| Frontend (Network) | http://192.168.0.23:5173 | All devices |
| Backend (Local) | http://localhost:3000 | Host only |
| Backend (Network) | http://192.168.0.23:3000 | All devices |
| API Health Check | http://192.168.0.23:3000/health | All devices |

---

**Last Updated**: 2025-11-28
**Your Local IP**: 192.168.0.23
**Network**: Local WiFi Only
