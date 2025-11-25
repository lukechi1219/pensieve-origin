# Pensieve Quickstart Guide

Welcome to **Pensieve** - your second brain knowledge management system built on Tiago Forte's CODE methodology (Capture, Organize, Distill, Express).

## Prerequisites

- macOS (tested on macOS Sequoia 24.4.0)
- [Homebrew](https://brew.sh/) package manager
- [Node.js 18+](https://nodejs.org/) (recommended: use LTS version)
- Google account (for Text-to-Speech API)

## Quick Installation (Recommended)

### One-Command Setup

Run the initialization script from the project root:

```bash
./init.sh
```

This script will:
1. ✅ Check prerequisites (Node.js, npm, Homebrew)
2. ☁️ Install and configure Google Cloud SDK
3. 📦 Set up backend dependencies and configuration
4. 🎨 Set up frontend dependencies and configuration

**Interactive prompts:**
- Google account authentication (opens browser)
- Google Cloud project selection
- Text-to-Speech API enablement
- Optional TTS testing

**Time required:** ~5-10 minutes (depending on download speeds)

After installation completes, continue to the **Starting the Servers** section below.

---

## Starting the Servers

After running `./init.sh`, you'll need **two terminal windows** to run the servers:

**Terminal 1 - Backend API Server:**

```bash
cd _system
npm run serve
```

You should see:
```
🚀 Pensieve API server running on http://localhost:3000
📂 Vault: /Users/.../pensieve-origin/vault
```

**Terminal 2 - Frontend Dev Server:**

```bash
cd web-ui
npm run dev
```

You should see:
```
VITE v7.2.4  ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Open your browser** and visit: **http://localhost:5173/**

You should see the Pensieve dashboard with:
- Inbox notes count
- Active projects count
- Journal streak
- Recent notes preview

---

## Understanding the Project Structure

```
pensieve-origin/
├── vault/                      # Your knowledge vault
│   ├── 0-inbox/               # Unsorted captures (start here)
│   ├── 1-projects/            # Active projects (2-3 month goals)
│   ├── 2-areas/               # Life domains (ongoing)
│   ├── 3-resources/           # Topic-based reference
│   ├── 4-archive/             # Completed projects
│   ├── journal/               # Daily journal entries (journal/yyyy/MM/yyyyMMdd.md)
│   └── templates/             # Note templates
├── _system/                    # Backend system
│   ├── src/                   # TypeScript source code
│   │   ├── cli/               # CLI commands
│   │   ├── core/              # Core models and services
│   │   └── web/               # Express REST API
│   ├── dist/                  # Compiled JavaScript
│   ├── .env                   # Backend configuration
│   └── script/                # System scripts (TTS, etc.)
├── web-ui/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── types/             # TypeScript types
│   │   └── lib/               # Utilities
│   └── .env                   # Frontend configuration
└── .claude/agents/             # JARVIS voice agents
```

## The PARA Method

Pensieve organizes knowledge using the **PARA method**:

- **Projects** (1-projects/): Short-term goals with deadlines (2-3 months)
  - Example: `1-projects/project-second-brain/`

- **Areas** (2-areas/): Long-term responsibilities with no end date
  - Example: `2-areas/health/`, `2-areas/career/`

- **Resources** (3-resources/): Topics of interest for reference
  - Example: `3-resources/programming/`, `3-resources/productivity/`

- **Archive** (4-archive/): Completed or inactive projects
  - Example: `4-archive/2025-11-project-second-brain/`

**Key Principle**: Organize by **actionability** (what project will I use this in?), not by topic.

## The CODE Workflow

### 1. Capture (擷取)

Collect information using 4 standards:

- **Inspiring**: Resonates emotionally
- **Useful**: Applicable to current projects
- **Personal**: Connects to your experience
- **Surprising**: Challenges assumptions

```bash
# Quick capture (coming soon)
pensieve capture "Interesting idea about..."

# Voice capture (coming soon)
pensieve voice capture
```

### 2. Organize (組織)

Move notes from `0-inbox/` to appropriate PARA folders:

```bash
# Move note to a project (coming soon)
pensieve move 20251125-143052 --to projects/second-brain

# List inbox items (coming soon)
pensieve list --inbox
```

### 3. Distill (精煉)

Use **Progressive Summarization** with JARVIS:

```bash
# Summarize a note with voice playback (coming soon)
pensieve distill summarize 20251125-143052 --voice

# Batch summarize inbox (coming soon)
pensieve distill batch --inbox
```

**4 Distillation Levels**:
- Level 0: Raw capture
- Level 1: Extract key paragraphs
- Level 2: Bold important sentences
- Level 3: Executive summary (JARVIS can generate)
- Level 4: Personal remix in your own words

### 4. Express (表達)

Use knowledge to create output:

```bash
# Create project from notes (coming soon)
pensieve express --project "New Blog Post"

# Export notes for publishing (coming soon)
pensieve export --format markdown
```

**Remember**: Your second brain is a "creative launchpad," not a "perfect filing cabinet."

## JARVIS Voice Agents

### English JARVIS

```bash
# In Claude Code, type:
Hey JARVIS

# JARVIS responds with witty British butler personality
# Example: "At your service, sir. What shall we tackle today?"

# Deactivate:
Goodbye JARVIS
```

### Chinese JARVIS (老賈)

```bash
# In Claude Code, type:
老賈

# JARVIS responds in Chinese with humor
# Example: "老闆，有什麼需要我效勞的嗎？"

# Deactivate:
再見老賈
```

### Voice Discussion Mode

```bash
# In Claude Code, type:
voice discussion

# Full conversational responses with TTS playback

# Deactivate:
cancel voice discussion
```

## Journal System

Pensieve includes a separate journaling system organized by date:

```
vault/journal/
├── 2025/
│   ├── 11/
│   │   ├── 20251125.md
│   │   ├── 20251126.md
│   │   └── ...
│   └── 12/
└── 2024/
```

```bash
# Open today's journal (coming soon)
pensieve journal

# Open specific date (coming soon)
pensieve journal --date 2025-11-20

# Voice-guided journaling with JARVIS (coming soon)
pensieve journal --voice
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Notes | `YYYYMMDD-HHMMSS-slug.md` | `20251125-143052-code-methodology.md` |
| Journal | `journal/yyyy/MM/yyyyMMdd.md` | `journal/2025/11/20251125.md` |
| Projects | `project-<slug>/` | `1-projects/project-second-brain/` |
| Archive | `YYYY-MM-<name>/` | `4-archive/2025-11-project-second-brain/` |

## Markdown Frontmatter

Every note includes YAML frontmatter for metadata:

```yaml
---
id: "20251125143052"
title: "Understanding CODE Methodology"
created: "2025-11-25 14:30:52"
modified: "2025-11-25 14:30:52"
tags: [productivity, knowledge-management]
para_folder: "projects"
para_path: "1-projects/second-brain"

# Progressive Summarization
distillation_level: 1
distillation_history:
  - level: 1
    date: "2025-11-25 14:30:52"
    type: "captured"

# CODE Standards
is_inspiring: true
is_useful: true
is_personal: false
is_surprising: true

status: "active"
---
```

## Development Commands

### Backend (_system)

```bash
cd _system

# Install dependencies
npm install

# Build TypeScript code
npm run build

# Start API server (production mode)
npm run serve

# Run tests
npm run test
```

### Frontend (web-ui)

```bash
cd web-ui

# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### CLI Usage (Future)

Once CLI is published, you can use these commands:

```bash
# Initialize vault
pensieve init

# Quick capture
pensieve capture "Your note content" --tags "cli,productivity"

# Journal management
pensieve journal                    # Open today's journal
pensieve journal --date 2025-11-20  # Specific date
pensieve journal streak             # Show current streak

# List notes
pensieve list inbox                 # List inbox notes
pensieve search tag productivity    # Search by tag

# Project management
pensieve project create "My Project"
pensieve project list
```

## Web Interface Features

**Current Status**: ✅ **Available Now!**

Access the web UI at **http://localhost:5173/** (after starting both servers)

**Implemented Features**:
- ✅ **Dashboard**: Overview with stats cards (inbox, projects, journal streak)
- ✅ **PARA Browser**: Navigate through inbox, projects, areas, resources
- ✅ **Note Cards**: Display notes with tags, CODE flags, distillation levels
- ✅ **Responsive Layout**: Sidebar navigation with modern UI
- ✅ **Real-time Data**: Connected to live API backend
- ✅ **Internationalization (i18n)**: Full bilingual support (English / 繁體中文)
  - Language switcher in sidebar footer
  - Persistent language preference
  - Locale-aware date formatting

**Coming Soon**:
- 📝 Note editor with Markdown preview
- 📅 Journal calendar view with habit tracking
- 🎯 Project management interface with milestones
- 🔍 Advanced search and filtering
- 🤖 JARVIS integration with progress tracking
- 📊 Analytics and insights dashboard

**Tech Stack**:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Express + Node.js + TypeScript
- **Storage**: File-based (Markdown + YAML frontmatter)
- **API**: RESTful with 20+ endpoints

## Troubleshooting

### TTS Script Errors

**Error: "找不到 gcloud"**
```bash
# Ensure gcloud is in PATH
which gcloud

# If not found, reinstall
brew reinstall --cask google-cloud-sdk
```

**Error: "未設定 GCP project"**
```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID
```

**Error: "API 錯誤 (403): Permission denied"**
```bash
# Re-authenticate with ADC
gcloud auth application-default login

# Ensure API is enabled
gcloud services enable texttospeech.googleapis.com
```

### Authentication Issues

```bash
# Check current authentication
gcloud auth list

# Check current project
gcloud config get-value project

# View ADC credentials location
echo $GOOGLE_APPLICATION_CREDENTIALS
# Should use: ~/.config/gcloud/application_default_credentials.json
```

## Cost Considerations

**Google Cloud Text-to-Speech API Pricing** (as of 2025):

- First 1 million characters/month: **FREE**
- Standard voices: $4 per 1 million characters
- WaveNet voices: $16 per 1 million characters

**Typical Usage**:
- Average note summary: ~200 characters
- 5,000 summaries/month = 1 million characters (within free tier)

**Pensieve uses Standard voices** (en-GB-Standard-B, cmn-TW-Standard-B) to maximize free tier usage.

### Web UI Issues

**Error: "It looks like you're trying to use tailwindcss directly as a PostCSS plugin"**

This project uses **Tailwind CSS v4** with the Vite plugin (not PostCSS). If you see this error:

```bash
cd web-ui

# Remove old Tailwind packages
npm uninstall tailwindcss postcss autoprefixer

# Install Tailwind v4 with Vite plugin
npm install -D tailwindcss @tailwindcss/vite

# Remove old config files
rm -f tailwind.config.js postcss.config.js
```

Verify `vite.config.ts` includes:
```typescript
import tailwindcss from '@tailwindcss/vite'

plugins: [
  tailwindcss(),
  react(),
]
```

Verify `src/index.css` uses v4 syntax:
```css
@import "tailwindcss";
```

**Backend API Connection Issues**

If frontend can't connect to backend API:

1. Check both servers are running:
   - Backend: http://localhost:3000/health
   - Frontend: http://localhost:5173/

2. Verify `_system/.env` has correct vault path:
   ```bash
   VAULT_PATH=../vault
   ```

3. Check `web-ui/.env` has correct API URL:
   ```bash
   VITE_API_URL=http://localhost:3000/api
   ```

4. Restart backend after config changes:
   ```bash
   cd _system
   npm run serve
   ```

## Next Steps

1. **Open the Web UI**: Visit http://localhost:5173/ and explore the dashboard
2. **Read the Philosophy**: Check `plan.md` for CODE methodology (Chinese)
3. **Review Technical Docs**:
   - `IMPLEMENTATION_PLAN.md` - Complete roadmap
   - `CLAUDE.md` - AI agent integration details
   - `API_DOCUMENTATION.md` - REST API reference
   - `CLI_USER_MANUAL.md` - CLI usage guide
4. **Start Using Pensieve**:
   - Create notes via web UI "快速捕捉" button
   - Browse PARA folders in sidebar
   - View journal streak and stats
5. **Try Voice Agents**: In Claude Code, say "Hey JARVIS" or "老賈"
6. **Contribute**: Check out the frontend code in `web-ui/src/`

## Resources

- [Tiago Forte's Building a Second Brain](https://www.buildingasecondbrain.com/)
- [PARA Method Overview](https://fortelabs.com/blog/para/)
- [Progressive Summarization](https://fortelabs.com/blog/progressive-summarization-a-practical-technique-for-designing-discoverable-notes/)
- [Google Cloud TTS Documentation](https://cloud.google.com/text-to-speech/docs)

---

## Appendix: Manual Installation (Advanced)

> ⚠️ **Note**: Most users should use the automated `./init.sh` script instead. This section is for advanced users who need manual control or are troubleshooting specific components.

### Individual Setup Scripts

If you need to set up components individually:

```bash
# Google Cloud SDK only
./_system/script/setup-gcloud.sh

# Backend only
./_system/script/setup-backend.sh

# Frontend only
./_system/script/setup-frontend.sh
```

### Complete Manual Setup Steps

<details>
<summary><strong>Click to expand manual installation guide</strong></summary>

#### 1. Install Google Cloud SDK

```bash
# Install via Homebrew
brew install --cask google-cloud-sdk

# Verify installation
gcloud --version
```

#### 2. Configure Google Cloud Authentication

```bash
# Step 1: Authenticate with your Google account
gcloud auth login

# Step 2: List your projects (or create a new one)
gcloud projects list

# Step 3: Set your project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID

# Step 4: Enable Text-to-Speech API
gcloud services enable texttospeech.googleapis.com

# Step 5: Set up Application Default Credentials
gcloud auth application-default login
```

#### 3. Test Text-to-Speech

```bash
# Make the TTS script executable
chmod +x _system/script/google_tts.sh

# Test English voice
_system/script/google_tts.sh "Hello, testing TTS" "en-GB"

# Test Chinese voice
_system/script/google_tts.sh "你好，測試語音" "cmn-TW"
```

#### 4. Install Backend Dependencies

```bash
cd _system
npm install
npm run build

# Create .env file
cat > .env << 'EOF'
VAULT_PATH=../vault
DEFAULT_LANGUAGE=zh
TTS_SCRIPT_PATH=./script/google_tts.sh
DEFAULT_TTS_VOICE_EN=en-GB-Standard-B
DEFAULT_TTS_VOICE_ZH=cmn-TW-Standard-B
WEB_PORT=3000
WEB_HOST=localhost
CLAUDE_CODE_MAX_CONCURRENT=3
CLAUDE_CODE_TIMEOUT=60000
JOURNAL_AUTO_CREATE=true
JOURNAL_DEFAULT_TEMPLATE=daily-reflection
AUTO_ARCHIVE_COMPLETED_PROJECTS=false
EOF

cd ..
```

#### 5. Install Frontend Dependencies

```bash
cd web-ui
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000/api" > .env

cd ..
```

#### 6. Start the Servers

Open two terminal windows:

**Terminal 1:**
```bash
cd _system && npm run serve
```

**Terminal 2:**
```bash
cd web-ui && npm run dev
```

Then visit http://localhost:5173/ in your browser.

</details>

---

**Philosophy**: The second brain is not a "perfect filing cabinet" but a "creative launchpad."

Start with imperfect captures. Refine opportunistically. Create relentlessly.

Welcome to your Pensieve journey!
