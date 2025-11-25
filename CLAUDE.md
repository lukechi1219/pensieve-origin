# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚫 Protected Files

**DO NOT MODIFY** the following files unless the user explicitly removes this rule:

- `IMPLEMENTATION_PLAN.md` - The master implementation plan is read-only. Reference it for guidance, but do not edit it.

If you need to suggest changes to the implementation plan, inform the user and ask for permission first.

---

## Project Overview

**Pensieve** is a second brain knowledge management system implementing Tiago Forte's **CODE methodology** (Capture, Organize, Distill, Express). The system combines CLI tools, web UI, and voice agents to create a comprehensive personal knowledge management platform.

### Core Philosophy: CODE Methodology

The system is built around four sequential steps documented in `plan.md`:

1. **Capture (擷取)**: Curated collection using 4 standards: Inspiring, Useful, Personal, Surprising
2. **Organize (組織)**: PARA method (Projects, Areas, Resources, Archive) - action-oriented, not academic classification
3. **Distill (精煉)**: Progressive Summarization with 4 layers, opportunity-based refinement
4. **Express (表達)**: Knowledge has value only when creating output - build "portfolio" not "notebook"

**Key Insight**: The second brain is not a "perfect filing cabinet" but a "creative launchpad."

---

## Architecture

### Technology Stack

**Backend:**
- **Runtime**: Node.js 18+ with TypeScript 5.3
- **API Server**: Express.js with 20+ REST endpoints
- **Storage**: File-based (Markdown + YAML frontmatter)
- **CLI**: Commander.js with rich TUI (future implementation)

**Frontend:**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7.2 (fast HMR, ESM-based)
- **Styling**: Tailwind CSS v4 (Vite plugin, no PostCSS)
- **Routing**: React Router v6
- **State**: React Context API (upgradeable to Zustand)
- **UI Components**: Custom components with lucide-react icons

**Voice & AI:**
- **TTS**: Google Cloud Text-to-Speech API
- **Voice Agents**: Claude Code CLI agents (JARVIS, voice-discussion)
- **AI Integration**: Claude Code CLI (headless mode, max 3 concurrent)

### Critical Architectural Decision: Claude Code CLI vs API

**This project uses Claude Code CLI exclusively, NOT the Claude API.**

**Reason**: Agents (JARVIS, voice-discussion) are only available in Claude Code CLI, not raw API.

**Benefits**:
- Zero additional cost (uses existing Claude Code subscription)
- Full access to `.claude/agents/` configurations
- Preserves agent personalities and behaviors
- Consistent experience across CLI and web

**Implementation Pattern**:
```typescript
// Execute Claude Code in headless mode
const { stdout } = await execAsync(
  `claude-code --headless < "${promptFile}"`,
  { timeout: 60000 }
);
```

**Concurrency**: Use `ClaudeCodePool` to limit simultaneous processes (max 3).

---

## Directory Structure

```
pensieve-origin/
├── init.sh                     # 🎯 One-command setup script
├── vault/                      # Knowledge vault (PARA + Journal)
│   ├── 0-inbox/               # Unsorted captures
│   ├── 1-projects/            # Active projects (2-3 month timeframe)
│   ├── 2-areas/               # Life domains (no end date)
│   ├── 3-resources/           # Topic-based reference
│   ├── 4-archive/             # Completed projects
│   ├── journal/               # Date-organized journal (journal/yyyy/MM/yyyyMMdd.md)
│   └── templates/             # Note templates
├── _system/                    # Backend system
│   ├── .env                   # Backend configuration (created by setup)
│   ├── src/
│   │   ├── core/              # Business logic
│   │   │   ├── models/       # Note, Journal, Project models
│   │   │   ├── services/     # NoteService, JournalService, ProjectService
│   │   │   └── utils/        # frontmatterParser, fileSystem, dateUtils
│   │   ├── cli/               # CLI commands
│   │   └── web/               # Express REST API server
│   │       ├── server.ts
│   │       └── routes/       # notes.ts, journals.ts, projects.ts
│   ├── dist/                  # Compiled JavaScript
│   └── script/                # System scripts
│       ├── google_tts.sh      # Text-to-Speech integration
│       ├── setup-backend.sh   # Backend setup script
│       ├── setup-frontend.sh  # Frontend setup script
│       └── setup-gcloud.sh    # Google Cloud SDK setup
├── web-ui/                     # React + Vite frontend
│   ├── .env                   # Frontend configuration (created by setup)
│   └── src/
│       ├── api/               # API client (notes, journals, projects)
│       ├── components/        # Layout, Sidebar, Header
│       ├── pages/             # Dashboard, Notes
│       ├── types/             # TypeScript type definitions
│       └── lib/               # Utilities (cn, etc.)
└── .claude/agents/             # JARVIS and voice agents
    ├── jarvis-oral-summarizer_en.md
    ├── jarvis-oral-summarizer_zh_Hant.md
    └── voice-discussion.md
```

### PARA Organization

- **Projects**: 2-3 month goals with `project.yaml` metadata
- **Areas**: Ongoing life domains (health, finance, relationships, career, learning)
- **Resources**: Topic-based knowledge storage
- **Archive**: Completed/inactive projects (pattern: `YYYY-MM-project-name/`)

### Journal Organization

- **Pattern**: `journal/{yyyy}/{MM}/{yyyyMMdd}.md`
- **Example**: `journal/2025/11/20251125.md`
- **Purpose**: Temporal, date-based organization separate from PARA system
- **Features**: Habit tracking, streak calculation, mood/energy logging

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Notes | `YYYYMMDD-HHMMSS-slug.md` | `20251125-143052-code-methodology.md` |
| Journal | `journal/yyyy/MM/yyyyMMdd.md` | `journal/2025/11/20251125.md` |
| Projects | `project-<slug>/` | `1-projects/project-second-brain/` |
| Archive | `YYYY-MM-<name>/` | `4-archive/2025-11-project-second-brain/` |

---

## Markdown Frontmatter Schema

### Core Note Schema

```yaml
---
id: "20251125143052"              # Timestamp-based unique ID
title: "Note Title"
created: "2025-11-25 14:30:52"
modified: "2025-11-25 14:30:52"
tags: [tag1, tag2]
para_folder: "projects"           # Current PARA category
para_path: "1-projects/second-brain"

# Progressive Summarization
distillation_level: 1             # 0-4 (0=raw, 4=fully distilled)
distillation_history:
  - level: 1
    date: "2025-11-25 14:30:52"
    type: "captured"

# CODE Standards
is_inspiring: false
is_useful: true
is_personal: false
is_surprising: false

status: "active"                  # active, archived, draft
---
```

### Journal Entry Schema

```yaml
---
id: "20251125"                    # Date-based ID (YYYYMMDD)
title: "Journal Entry - November 25, 2025"
type: "journal"
date: "2025-11-25"
tags: [journal, daily]
mood: "productive"                # Optional
energy_level: 8                   # 1-10 scale
habits_completed: [meditation, exercise]
gratitude: ["Item 1", "Item 2"]
---
```

---

## Voice Agent Integration

### JARVIS Agents

**Activation**:
- English: "Hey JARVIS" (`.claude/agents/jarvis-oral-summarizer_en.md`)
- Chinese: "老賈" (`.claude/agents/jarvis-oral-summarizer_zh_Hant.md`)

**Personality**: Witty British butler with dry humor, addresses user as "sir" or "boss"

**TTS Integration**:
```bash
_system/script/google_tts.sh "text" "en-GB"  # English
_system/script/google_tts.sh "text" "cmn-TW" # Chinese
```

**Use Cases**:
1. Progressive summarization (Distill step)
2. Voice-guided journaling
3. Batch note summarization
4. Humorous technical explanations

**Deactivation**: "Goodbye JARVIS"

### Voice Discussion Agent

**Activation**: "voice discussion"
**Purpose**: Conversational spoken-style responses with full TTS playback
**Deactivation**: "cancel voice discussion"

---

## Progressive Summarization

Four distillation layers (tracked in frontmatter):

0. **Raw Capture**: Original content as captured
1. **Excerpts**: Extract key paragraphs
2. **Highlights**: Bold important sentences
3. **Summary**: Executive summary (JARVIS can generate)
4. **Remix**: Personal interpretation in own words

**Philosophy**: Opportunity-based refinement - add value each time you touch a note, don't aim for perfection upfront.

---

## Quick Start & Development Commands

### Initial Setup (One-Time)

```bash
# 🎯 Recommended: Automated setup (one command)
./init.sh

# Alternative: Individual component setup
./_system/script/setup-gcloud.sh   # Google Cloud SDK only
./_system/script/setup-backend.sh  # Backend only
./_system/script/setup-frontend.sh # Frontend only
```

### Running the System

**Backend API Server:**
```bash
cd _system
npm run serve  # Starts on http://localhost:3000
```

**Frontend Dev Server:**
```bash
cd web-ui
npm run dev    # Starts on http://localhost:5173
```

**Access Web UI:** Open browser to http://localhost:5173/

### Development Commands

**Backend (_system):**
```bash
npm run dev    # Watch mode with tsx (future)
npm run build  # Compile TypeScript
npm run test   # Run tests with Vitest
npm run serve  # Start Express API
```

**Frontend (web-ui):**
```bash
npm run dev      # Start dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
```

### CLI Usage (Future Implementation)

```bash
pensieve init                           # Initialize vault
pensieve capture "text"                 # Quick capture
pensieve journal                        # Open today's journal
pensieve journal --date 2025-11-20      # Specific date
pensieve distill summarize <id> --voice # JARVIS summary with TTS
pensieve voice capture                  # Voice-to-text capture
```

### Testing & Utilities

```bash
# Test Google TTS
_system/script/google_tts.sh "Hello, testing TTS" "en-GB"
_system/script/google_tts.sh "你好，測試語音" "cmn-TW"

# View implementation plan
cat IMPLEMENTATION_PLAN.md

# View CODE methodology reference
cat plan.md

# View API documentation
cat API_DOCUMENTATION.md

# View CLI user manual
cat CLI_USER_MANUAL.md
```

---

## Key Implementation Guidelines

### 1. Claude Code CLI Best Practices

**Always use file-based input for safety**:
```typescript
const promptFile = await createPromptFile(agentTrigger, content);
try {
  const { stdout } = await execAsync(`claude-code --headless < "${promptFile}"`);
} finally {
  await fs.unlink(promptFile);
}
```

**Never**:
- Use direct string input (risk of command injection)
- Exceed 3 concurrent processes
- Skip timeout configuration
- Forget to cleanup temp files

### 2. PARA Organization Rules

- **Projects** have end dates (2-3 months)
- **Areas** are ongoing (no end date)
- **Resources** are topic-based, not action-based
- **Archive** preserves project history

**Core Question**: "Which project will I use this note in?" (not "What category does this belong to?")

### 3. Journal Feature Requirements

- Auto-create year/month folders on demand
- One file per day (no duplicates)
- Support streak calculation (consecutive days with entries)
- Link to related projects/areas via frontmatter
- Voice-guided reflection with JARVIS

### 4. Security Considerations

```typescript
// Good: Sanitize or use file input
function sanitizeForShell(input: string): string {
  return input.replace(/[;&|`$()<>]/g, '');
}

// Better: Use file input
const promptFile = await createPromptFile(trigger, content);
```

**Never**:
- Pass user input directly to shell commands
- Store sensitive data in frontmatter
- Commit API keys or tokens

### 5. Tailwind CSS v4 Best Practices

**This project uses Tailwind CSS v4 with the Vite plugin (NOT PostCSS).**

**Configuration:**

`vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),  // Must come before react()
    react(),
  ],
})
```

`src/index.css`:
```css
@import "tailwindcss";  /* NOT @tailwind directives */
```

**Key Changes from v3:**
- ❌ No `tailwind.config.js` file (config via CSS)
- ❌ No `postcss.config.js` file (use Vite plugin)
- ❌ No `@tailwind base/components/utilities` (use `@import`)
- ✅ Automatic content detection (no manual paths)
- ✅ 5x faster full builds, 100x faster incremental builds

**If you see PostCSS errors:**
```bash
cd web-ui
npm uninstall tailwindcss postcss autoprefixer
npm install -D tailwindcss @tailwindcss/vite
rm -f tailwind.config.js postcss.config.js
```

---

## Testing Strategy

### Unit Tests (Vitest)

Mock Claude Code CLI calls:
```typescript
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, opts, callback) => {
    callback(null, { stdout: 'Mocked JARVIS summary', stderr: '' });
  })
}));
```

### Integration Tests

Test with real Claude Code CLI (30s timeout):
```typescript
test('real JARVIS summarization', async () => {
  const service = new JarvisService();
  const summary = await service.summarizeNote(noteId, 'en');
  expect(summary).toBeTruthy();
}, 30000);
```

---

## Performance Considerations

**Claude Code CLI Overhead**:
- Process spawn: ~500ms - 1s
- Agent activation: ~1s - 2s
- **Total per call**: ~2s - 5s

**Optimization Strategies**:
1. Batch processing with sequential execution
2. Background jobs for non-urgent tasks
3. Cache summaries to avoid re-processing
4. Rate limiting (2s delay between calls)
5. Use `ClaudeCodePool` for concurrency control

---

## Web API Patterns

### Server-Sent Events (SSE) for Progress

```typescript
// Batch summarization with progress updates
router.post('/summarize/batch', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  await jarvisService.batchSummarize(noteIds, language, (current, total) => {
    res.write(`data: ${JSON.stringify({
      type: 'progress',
      current,
      total
    })}\n\n`);
  });
});
```

### React Integration

```typescript
const eventSource = new EventSource('/api/jarvis/summarize/batch');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'progress') setProgress(data);
};
```

---

## Common Pitfalls

1. **Don't confuse Claude API with Claude Code CLI** - This project uses CLI only
2. **Don't create notes outside PARA/journal structure** - Maintain organization
3. **Don't skip Progressive Summarization tracking** - Update `distillation_level` in frontmatter
4. **Don't use PARA for journals** - Journals are temporal, not project-based
5. **Don't forget TTS cleanup** - Always handle TTS failures gracefully
6. **Don't mix structural and behavioral changes** - Follow TDD and Tidy First approach

---

## Implementation Status

See `IMPLEMENTATION_PLAN.md` for detailed 9-week timeline and `PROGRESS.md` for current status.

### ✅ Completed Phases

1. ✅ **Phase 1-2**: Foundation & PARA organization
   - TypeScript project structure
   - Core models (Note, Journal, Project)
   - Services (NoteService, JournalService, ProjectService)
   - PARA folder structure
   - CLI commands (init, capture, journal, list, search, project)

2. ✅ **Phase 6**: Web Backend API
   - Express server with 20+ REST endpoints
   - Notes API (CRUD, move, search)
   - Journals API (CRUD, stats, streak)
   - Projects API (CRUD, milestones, progress)
   - Complete API documentation

3. ✅ **Phase 7**: Web Frontend (MVP)
   - React + Vite + TypeScript setup
   - Tailwind CSS v4 integration
   - Dashboard with stats cards
   - PARA notes browser
   - Sidebar navigation
   - API client integration

4. ✅ **Phase 0**: Installation & Setup
   - Automated setup scripts (`init.sh`)
   - Google Cloud SDK integration
   - TTS configuration
   - Development environment setup

### 🚧 In Progress

- **Phase 7 (cont.)**: Additional frontend features
  - Note editor with Markdown preview
  - Journal entry interface
  - Project management interface
  - Advanced search and filtering

### 📋 Pending Phases

4. **Phase 4**: Progressive summarization + JARVIS
5. **Phase 5**: Voice capture integration
6. **Phase 9**: Export & polish

**Current Status**: Web UI MVP operational, ready for feature expansion

---

## Reference Documentation

### Setup & Quick Start
- `QUICKSTART.md` - Quick start guide with automated setup
- `init.sh` - One-command installation script
- `_system/script/setup-*.sh` - Individual component setup scripts

### Architecture & Planning
- `IMPLEMENTATION_PLAN.md` - Complete 9-week technical specification
- `PROGRESS.md` - Current implementation status and completed tasks
- `plan.md` - CODE methodology philosophy (Chinese)
- `CLAUDE.md` - This file (project guidance for Claude Code)

### API & CLI Documentation
- `API_DOCUMENTATION.md` - REST API reference (20+ endpoints)
- `API_TEST_RESULTS.md` - API testing results and examples
- `CLI_USER_MANUAL.md` - CLI commands usage guide

### Configuration Files
- `_system/.env` - Backend configuration (vault path, TTS, ports)
- `web-ui/.env` - Frontend configuration (API URL)
- `.claude/agents/` - JARVIS and voice agent configurations

### Scripts & Tools
- `_system/script/google_tts.sh` - Text-to-Speech integration
- `_system/script/setup-gcloud.sh` - Google Cloud SDK setup
- `_system/script/setup-backend.sh` - Backend setup
- `_system/script/setup-frontend.sh` - Frontend setup
