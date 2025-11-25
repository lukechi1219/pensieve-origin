# Implementation Plan: Pensieve Second Brain System

## Executive Summary

Transform the pensieve-origin project into a complete second brain system implementing Tiago Forte's CODE methodology (Capture, Organize, Distill, Express) using TypeScript/Node.js with both CLI and web interfaces, integrated with existing JARVIS voice agents.

**Technology Stack:**
- File-based storage (Markdown + YAML frontmatter)
- Node.js/TypeScript for backend
- CLI with rich TUI + Web UI (Vite + React)
- Hybrid PARA organization (physical folders + flexible tagging)

---

## 1. Project Structure

### Root Directory Layout
```
pensieve-origin/
├── _system/                    # System infrastructure (existing)
│   └── script/
│       └── google_tts.sh      # Google Cloud TTS integration
├── .claude/                    # Claude Code agents (existing)
│   └── agents/                # voice-discussion, JARVIS agents
├── vault/                      # PARA knowledge vault (NEW)
│   ├── 0-inbox/               # Capture staging area
│   ├── 1-projects/            # Active 2-3 month projects
│   ├── 2-areas/               # Ongoing life areas
│   ├── 3-resources/           # Reference material
│   ├── 4-archive/             # Completed/inactive items
│   ├── journal/               # Daily journal entries (NEW)
│   └── templates/             # Note templates
├── src/                        # TypeScript source code (NEW)
│   ├── cli/                   # CLI interface
│   ├── core/                  # Core business logic
│   ├── web/                   # Web server & API
│   └── types/                 # TypeScript type definitions
├── web-ui/                     # Vite + React frontend (NEW)
├── dist/                       # Compiled JavaScript output
├── tests/                      # Test files
├── docs/                       # Documentation
├── package.json
├── tsconfig.json
└── plan.md                    # CODE methodology reference (existing)
```

### PARA Vault Organization

**0-inbox/** - Unsorted captures awaiting organization
- Files: `YYYYMMDD-HHMMSS-capture.md`

**1-projects/** - Active projects with 2-3 month timeframes
```
1-projects/
└── project-name/
    ├── notes/
    ├── resources/
    └── project.yaml
```

**2-areas/** - Life domains with no end date
```
2-areas/
├── health/
├── finance/
├── relationships/
├── career/
└── learning/
```

**3-resources/** - Topic-based reference material
```
3-resources/
├── programming-typescript/
├── productivity-methods/
└── second-brain-methodology/
```

**4-archive/** - Completed/inactive projects
```
4-archive/
└── YYYY-MM-project-name/
```

**journal/** - Daily journal entries organized by date
```
journal/
├── 2025/
│   ├── 01/
│   │   ├── 20250101.md
│   │   ├── 20250102.md
│   │   └── ...
│   ├── 02/
│   │   └── ...
│   └── 11/
│       ├── 20251125.md
│       └── 20251126.md
└── 2026/
    └── ...
```

**templates/** - Note templates for different capture types
```
templates/
├── note-default.md
├── note-project.md
├── note-meeting.md
├── note-book.md
└── journal-daily.md
```

---

## 2. Data Model - Markdown Frontmatter Schema

### Core Note Schema
```yaml
---
id: "20251125143052"              # Timestamp-based unique ID
title: "Note Title"               # Human-readable title
created: "2025-11-25 14:30:52"   # Creation timestamp
modified: "2025-11-25 14:30:52"  # Last modification timestamp
tags: [tag1, tag2, tag3]         # Flexible tagging system
aliases: [alias1, alias2]        # Alternative names for linking
para_folder: "projects"          # Current PARA category
para_path: "1-projects/second-brain" # Full relative path
project_id: "project-id"         # Link to parent project (optional)
area_id: "area-id"              # Link to parent area (optional)

# Progressive Summarization Tracking
distillation_level: 1           # 0-4 (0=raw, 4=fully distilled)
distillation_history:
  - level: 1
    date: "2025-11-25 14:30:52"
    type: "captured"
  - level: 2
    date: "2025-11-26 10:15:00"
    type: "highlighted"

# Capture Metadata
source: "voice-capture"         # CLI, voice, web, imported
source_url: ""                  # Original URL if applicable
author: ""                      # Original author if applicable

# CODE Standards (Capture phase)
is_inspiring: false            # Sparks new ideas?
is_useful: true               # Future application potential?
is_personal: false            # Personal resonance?
is_surprising: false          # Challenges existing knowledge?

# Status
status: "active"              # active, archived, draft
visibility: "private"         # private, shared, public

# Links (auto-generated)
backlinks: []                # Notes linking to this note
outgoing_links: []          # Notes this note links to
---

# Note Content

Content with markdown formatting...

## Progressive Summarization Layers

**Layer 1: Original excerpt** (plain text)

**Layer 2: Bold highlights** (important sentences)

**Layer 3: Summary**
> Executive summary in concise format

**Layer 4: Remix** (in your own words)
```

### Project Metadata (project.yaml)
```yaml
id: "project-20251125"
name: "Second Brain Implementation"
description: "Build a personal knowledge management system"
status: "active"
start_date: "2025-11-25"
target_end_date: "2026-01-31"
priority: "high"
tags: [knowledge-management, code-methodology]
goals:
  - "CLI interface functional"
  - "Web UI deployed"
  - "100 notes organized"
notes_count: 15
completion_percentage: 35
```

### Area Metadata (area.yaml)
```yaml
id: "area-health"
name: "Health & Fitness"
description: "Physical and mental wellbeing"
status: "active"
created: "2025-11-25"
tags: [health, fitness, wellbeing]
review_frequency: "weekly"
standards:
  - "Exercise 3x per week"
  - "8 hours sleep minimum"
```

### Journal Entry Schema
```yaml
---
id: "20251125"                    # Date-based ID (YYYYMMDD)
title: "Journal Entry - November 25, 2025"
type: "journal"                   # Special type marker
date: "2025-11-25"               # Journal date
created: "2025-11-25 08:30:00"   # Creation timestamp
modified: "2025-11-25 22:15:00"  # Last modification
tags: [journal, daily]           # Auto-tagged as journal
mood: "productive"               # Optional mood tracker
weather: "sunny"                 # Optional weather
energy_level: 8                  # Optional 1-10 scale

# Daily tracking (optional)
habits_completed:
  - "meditation"
  - "exercise"
  - "writing"

gratitude:
  - "Completed the second brain implementation plan"
  - "Had a great conversation with team"

# Links to related content
related_projects: ["project-second-brain-implementation"]
related_areas: ["career", "learning"]

# Status
status: "active"
visibility: "private"
---

# Journal Entry - November 25, 2025

## Morning Reflection
What are my intentions for today?

## Daily Log
What happened today?

## Evening Reflection
What did I learn? What am I grateful for?

## Tomorrow's Focus
What are my top 3 priorities?
```

---

## 3. Technology Stack

### Core Dependencies
```json
{
  "dependencies": {
    "commander": "^11.1.0",       // CLI framework
    "inquirer": "^9.2.12",        // Interactive prompts
    "chalk": "^5.3.0",            // Terminal colors
    "ora": "^7.0.1",              // Loading spinners
    "yaml": "^2.3.4",             // YAML parsing
    "gray-matter": "^4.0.3",      // Frontmatter parsing
    "chokidar": "^3.5.3",         // File watching
    "express": "^4.18.2",         // Web server
    "marked": "^10.0.0",          // Markdown parsing
    "fast-glob": "^3.3.2",        // File searching
    "date-fns": "^2.30.0"         // Date utilities
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",              // TypeScript execution
    "vitest": "^1.0.4",           // Testing
    "prettier": "^3.1.1"
  }
}
```

### Important Note: No Claude API Required

**This project uses Claude Code CLI (headless mode) exclusively:**
- ✅ Uses existing Claude Code subscription (no additional cost)
- ✅ Full access to configured agents (JARVIS, voice-discussion)
- ✅ Preserves agent personalities and configurations
- ❌ Does NOT require separate Claude API key (`CLAUDE_API_KEY`)
- ❌ Does NOT use `@anthropic-ai/sdk` package

**Why CLI over API:**
1. **Agents are CLI-only**: The JARVIS and voice agents are not available via API
2. **Zero additional cost**: Uses existing subscription
3. **Consistent experience**: Same agents work in terminal and web
4. **Configuration reuse**: All `.claude/agents/` configs work automatically

### Web UI Stack
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "react-markdown": "^9.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.7"
  }
}
```

---

## 4. Source Code Structure

### src/core/ - Business Logic
```
src/core/
├── models/
│   ├── Note.ts              # Note class with validation
│   ├── Journal.ts           # Journal entry model (NEW)
│   ├── Project.ts           # Project metadata
│   ├── Area.ts              # Area metadata
│   └── Tag.ts               # Tag management
├── services/
│   ├── NoteService.ts       # Note CRUD operations
│   ├── JournalService.ts    # Journal-specific operations (NEW)
│   ├── SearchService.ts     # Search & indexing
│   ├── LinkService.ts       # Backlink management
│   ├── DistillService.ts    # Progressive summarization
│   ├── ParaService.ts       # PARA folder operations
│   └── JarvisService.ts     # JARVIS agent integration
├── utils/
│   ├── fileUtils.ts         # File I/O helpers
│   ├── dateUtils.ts         # Date formatting
│   ├── idGenerator.ts       # Unique ID generation
│   ├── frontmatterParser.ts # YAML frontmatter
│   ├── markdownParser.ts    # Markdown processing
│   └── ClaudeCodePool.ts    # Concurrency management for CLI calls (NEW)
└── config/
    └── index.ts             # Configuration management
```

### src/cli/ - Command Line Interface
```
src/cli/
├── index.ts                 # CLI entry point
├── commands/
│   ├── init.ts             # Initialize vault
│   ├── capture.ts          # Quick capture
│   ├── journal.ts          # Journal commands (NEW)
│   ├── list.ts             # List notes
│   ├── view.ts             # View note
│   ├── move.ts             # Move note to PARA folder
│   ├── search.ts           # Search notes
│   ├── distill.ts          # Progressive summarization
│   ├── project.ts          # Project management
│   ├── voice.ts            # Voice commands
│   └── export.ts           # Export operations
└── ui/
    ├── prompts.ts          # Inquirer prompts
    └── formatters.ts       # Output formatting
```

### src/web/ - Web Server & API
```
src/web/
├── server.ts               # Express server setup
├── routes/
│   ├── notes.ts           # Note endpoints
│   ├── journal.ts         # Journal endpoints (NEW)
│   ├── search.ts          # Search endpoints
│   ├── projects.ts        # Project endpoints
│   └── tags.ts            # Tag endpoints
├── controllers/
│   ├── NoteController.ts
│   ├── JournalController.ts  # Journal controller (NEW)
│   ├── SearchController.ts
│   └── ProjectController.ts
└── middleware/
    ├── errorHandler.ts
    └── logger.ts
```

---

## 5. Implementation Sequence

### Phase 1: Foundation (Week 1)
**Goal: Basic CLI infrastructure and note system**

**Tasks:**
1. Initialize TypeScript project (package.json, tsconfig.json)
2. Install core dependencies
3. Create folder structure (src/, vault/, tests/)
4. Implement Note model (src/core/models/Note.ts)
5. Implement frontmatter parser (src/core/utils/frontmatterParser.ts)
6. Implement NoteService (src/core/services/NoteService.ts)
7. Create CLI framework (src/cli/index.ts)
8. Implement basic commands: init, capture, list, view

**Deliverable:** Working CLI for basic capture and viewing

### Phase 2: PARA Organization (Week 2)
**Goal: Full PARA folder system**

**Tasks:**
1. Create PARA folder initialization
2. Implement note move operations
3. Build Project model and ProjectService
4. Build Area model and AreaService
5. Implement YAML metadata for projects/areas
6. Add CLI commands: move, project, area
7. Archive workflow

**Deliverable:** Complete PARA organization system

### Phase 3: Search & Navigation (Week 3)
**Goal: Find and explore notes**

**Tasks:**
1. Implement SearchService with fast-glob
2. Tag-based filtering
3. PARA folder filtering
4. Wikilink parser for `[[note-title]]` syntax
5. Build backlink index (LinkService)
6. Add CLI commands: search, tags, backlinks
7. Orphan note detection

**Deliverable:** Powerful search and link navigation

### Phase 4: Progressive Summarization (Week 4)
**Goal: Distillation system with JARVIS**

**Tasks:**
1. Track distillation levels in frontmatter
2. Implement DistillService
3. Build JarvisService for agent integration
4. TTS integration via google_tts.sh
5. Visual distillation indicators in CLI
6. Add CLI commands: distill (highlight, summarize, remix)
7. Batch processing capability

**Deliverable:** Working progressive summarization with voice output

### Phase 5: Web Backend API (Week 5)
**Goal: REST API for web interface**

**Tasks:**
1. Setup Express server (src/web/server.ts)
2. Implement REST endpoints:
   - GET/POST/PUT/DELETE /api/notes
   - GET /api/search
   - GET/POST /api/projects
   - GET /api/tags
   - GET /api/backlinks/:id
3. CORS middleware
4. Error handling middleware
5. Request logging
6. API documentation

**Deliverable:** Complete REST API

### Phase 6: Web Frontend (Week 6-7)
**Goal: Full-featured web UI**

**Tasks:**
1. Initialize Vite + React project (web-ui/)
2. Setup React Router
3. Create layout components (Header, Sidebar, Footer)
4. Build core views:
   - Inbox view
   - Note list component
   - Note editor (markdown)
   - Search interface
5. Advanced features:
   - Project dashboard
   - Graph visualization
   - Tag management
6. Responsive design
7. API integration with axios

**Deliverable:** Production-ready web UI

### Phase 7: Express & Polish (Week 8)
**Goal: Knowledge output and sharing**

**Tasks:**
1. Export features (PDF, HTML, project bundles)
2. Publishing system (share notes publicly)
3. End-to-end testing
4. Documentation (README, CLI reference, guides)
5. Performance optimization
6. Launch preparation

**Deliverable:** Complete second brain system ready for daily use

---

## 6. Integration with Existing Voice Agents

### JARVIS Integration for Summarization

**Architecture Decision:**
- **Use Claude Code CLI** (headless mode) instead of Claude API
- **Reason**: Agents are only available in Claude Code CLI, not the raw API
- **Benefit**: Preserves all JARVIS personality and configuration from `.claude/agents/`

**Service Implementation:**
```typescript
// src/core/services/JarvisService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class JarvisService {
  /**
   * Summarize note using JARVIS agent via Claude Code CLI
   * Preserves agent personality from .claude/agents/ configuration
   */
  async summarizeNote(noteId: string, language: 'en' | 'zh' = 'en'): Promise<string> {
    const note = await NoteService.getById(noteId);

    // Activate appropriate JARVIS agent
    const agentTrigger = language === 'en' ? 'Hey JARVIS' : '老賈';

    // Create temp prompt file to avoid shell escaping issues
    const promptFile = await this.createPromptFile(agentTrigger, note.content);

    try {
      // Execute Claude Code in headless mode with agent
      const { stdout } = await execAsync(
        `claude-code --headless < "${promptFile}"`,
        {
          cwd: process.cwd(),
          timeout: 60000, // 60 second timeout
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );

      const summary = this.extractAgentResponse(stdout);

      // Play summary via TTS
      await this.playJarvisSummary(summary, language);

      // Update note with summary and distillation level
      await NoteService.updateDistillation(noteId, summary, 3);

      return summary;

    } finally {
      // Cleanup temp file
      await fs.unlink(promptFile);
    }
  }

  /**
   * Create temporary prompt file for Claude Code input
   */
  private async createPromptFile(agentTrigger: string, content: string): Promise<string> {
    const tmpDir = path.join(process.cwd(), '.tmp');
    await fs.mkdir(tmpDir, { recursive: true });

    const promptPath = path.join(tmpDir, `prompt-${Date.now()}.txt`);

    const prompt = `${agentTrigger}, please summarize this note:

${content}`;

    await fs.writeFile(promptPath, prompt, 'utf-8');
    return promptPath;
  }

  /**
   * Extract JARVIS response from Claude Code output
   */
  private extractAgentResponse(output: string): string {
    // Parse actual agent response from CLI output
    const lines = output.split('\n');
    const responseStart = lines.findIndex(line =>
      line.includes('JARVIS') || line.includes('老賈')
    );

    if (responseStart === -1) {
      return output.trim(); // Fallback: return everything
    }

    return lines.slice(responseStart + 1).join('\n').trim();
  }

  /**
   * Play summary via Google Cloud TTS
   */
  private async playJarvisSummary(text: string, language: 'en' | 'zh'): Promise<void> {
    const scriptPath = path.join(process.cwd(), '_system/script/google_tts.sh');
    const langCode = language === 'en' ? 'en-GB' : 'cmn-TW';

    try {
      await execAsync(`"${scriptPath}" "${text.replace(/"/g, '\\"')}" "${langCode}"`);
    } catch (error) {
      console.error('TTS playback failed:', error);
      // Don't throw - TTS failure shouldn't block summarization
    }
  }

  /**
   * Batch summarization with progress tracking
   */
  async batchSummarize(
    noteIds: string[],
    language: 'en' | 'zh',
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (let i = 0; i < noteIds.length; i++) {
      const noteId = noteIds[i];

      try {
        const summary = await this.summarizeNote(noteId, language);
        results.set(noteId, summary);

        if (onProgress) {
          onProgress(i + 1, noteIds.length);
        }

        // Rate limiting: wait between requests
        await this.delay(2000); // 2 second delay

      } catch (error) {
        console.error(`Failed to summarize note ${noteId}:`, error);
        results.set(noteId, `ERROR: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Voice-guided journaling with JARVIS
   */
  async guidedJournaling(date: Date, language: 'en' | 'zh'): Promise<void> {
    const agentTrigger = language === 'en' ? 'Hey JARVIS' : '老賈';

    const prompt = `${agentTrigger}, help me with my daily journal reflection for ${date.toDateString()}.
Ask me thoughtful questions about my day, what I learned, and what I'm grateful for.`;

    const promptFile = await this.createPromptFile(agentTrigger, prompt);

    try {
      const { stdout } = await execAsync(
        `claude-code --headless < "${promptFile}"`,
        { timeout: 300000 } // 5 minutes for interactive session
      );

      // Parse JARVIS questions and responses
      const journalEntry = this.formatJournalFromConversation(stdout);

      // Save to journal
      await JournalService.saveEntry(date, journalEntry);

    } finally {
      await fs.unlink(promptFile);
    }
  }

  private formatJournalFromConversation(conversation: string): string {
    // Parse conversation and format as journal entry
    // Implementation depends on conversation format
    return conversation;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Concurrency Management:**
```typescript
// src/core/utils/ClaudeCodePool.ts
export class ClaudeCodePool {
  private maxConcurrent = 3; // Max 3 simultaneous processes
  private running = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if at max capacity
    while (this.running >= this.maxConcurrent) {
      await this.delay(100);
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in JarvisService
const claudePool = new ClaudeCodePool();

async summarizeNote(noteId: string, language: 'en' | 'zh'): Promise<string> {
  return claudePool.execute(() => this.summarizeNoteImpl(noteId, language));
}
```

**CLI Command:**
```bash
# Summarize with JARVIS voice output
pensieve distill summarize <note-id> --voice --lang en

# Batch summarization
pensieve distill batch --folder inbox --voice
```

---

## 7. CLI Command Reference

### Capture Commands
```bash
pensieve capture "Quick note text"
pensieve capture --interactive          # Open editor
pensieve capture --voice                # Voice input
pensieve capture --tags "tag1,tag2"     # With tags
```

### Journal Commands (NEW)
```bash
pensieve journal                        # Open today's journal
pensieve journal today                  # Alias for today's journal
pensieve journal yesterday              # Open yesterday's journal
pensieve journal --date 2025-11-20      # Open specific date
pensieve journal --week                 # View this week's entries
pensieve journal --month                # View this month's entries
pensieve journal list --month 2025-11   # List all entries in November 2025
pensieve journal search "keyword"       # Search journal entries
pensieve journal stats                  # Show journal statistics
pensieve journal streak                 # Show writing streak
```

### Organization Commands
```bash
pensieve list                           # List inbox notes
pensieve list --folder projects         # List projects
pensieve view <id>                      # View note
pensieve edit <id>                      # Edit note
pensieve move <id> projects/second-brain # Move to PARA
pensieve archive <id>                   # Archive note
```

### Project/Area Management
```bash
pensieve project create "Project Name"
pensieve project list
pensieve project archive <project-id>
pensieve area create "Area Name"
pensieve area list
```

### Search & Discovery
```bash
pensieve search "query text"
pensieve search --tag productivity
pensieve search --folder projects
pensieve tags                           # List all tags
pensieve backlinks <id>                 # Show backlinks
```

### Progressive Summarization
```bash
pensieve distill highlight <id>         # Interactive highlighting
pensieve distill summarize <id> --voice # JARVIS summary with TTS
pensieve distill remix <id>             # Create personal interpretation
pensieve distill batch --folder inbox   # Batch processing
```

### Voice Commands
```bash
pensieve voice review <id>              # Read note aloud
```

### Export & Express
```bash
pensieve export <id> --format pdf
pensieve export <id> --format html
pensieve publish <id>                   # Share publicly
```

### System Commands
```bash
pensieve init                           # Initialize vault
pensieve stats                          # Show statistics
pensieve serve                          # Start web server
```

---

## 8. Web UI Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: Search | User Menu | Settings          │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │ Main Content Area                    │
│          │                                      │
│ - Inbox  │ Note List / Editor / Graph View     │
│ - Projec │                                      │
│ - Areas  │                                      │
│ - Resour │                                      │
│ - Archiv │                                      │
│          │                                      │
│ - Tags   │                                      │
│          │                                      │
├──────────┴──────────────────────────────────────┤
│ Footer: Stats | Last Sync | Version            │
└─────────────────────────────────────────────────┘
```

### Key Views
1. **Inbox View** - Uncategorized captures with quick actions
2. **Note Editor** - Split view: Markdown editor + Preview
3. **Journal View** - Calendar view + daily entry editor (NEW)
4. **Project Dashboard** - Active projects with progress indicators
5. **Graph View** - Interactive note graph visualization
6. **Search Interface** - Full-text search with filters

### API Integration
```typescript
// web-ui/src/services/api.ts
export const notesApi = {
  list: (folder?: string) => axios.get('/api/notes', { params: { folder } }),
  get: (id: string) => axios.get(`/api/notes/${id}`),
  create: (data) => axios.post('/api/notes', data),
  update: (id, data) => axios.put(`/api/notes/${id}`, data),
  delete: (id) => axios.delete(`/api/notes/${id}`)
};
```

---

## 9. Progressive Summarization Implementation

### Four Distillation Layers

**Layer 0: Raw Capture** - Original content as captured
**Layer 1: Excerpts** - Extract key paragraphs
**Layer 2: Highlights** - Bold important sentences
**Layer 3: Summary** - Executive summary (JARVIS can generate this)
**Layer 4: Remix** - Personal interpretation in own words

### Tracking in Frontmatter
```yaml
distillation_level: 2
distillation_history:
  - level: 0
    date: "2025-11-25 14:30:52"
    type: "captured"
  - level: 2
    date: "2025-11-26 10:15:00"
    type: "highlighted"
```

### Visual Representation in CLI
```
┌─────────────────────────────────────────────────┐
│ Building a Second Brain - CODE Methodology      │
│ ID: 20251125143052                              │
│ Tags: #knowledge-management #basb              │
│ Distillation: ████░░ Level 2/4                 │
└─────────────────────────────────────────────────┘
```

---

## 10. Journal Feature Implementation (NEW)

### Overview
The journal feature provides a dedicated space for daily reflections, organized chronologically in a `journal/{yyyy}/{MM}/{yyyyMMdd}.md` structure, separate from the PARA system.

### Key Features

**1. Automatic Date-Based Organization**
- Files automatically created in correct year/month folders
- Filename format: `YYYYMMDD.md` (e.g., `20251125.md`)
- Path: `journal/2025/11/20251125.md`

**2. Quick Access Commands**
```bash
pensieve journal                    # Open today's entry (auto-creates if missing)
pensieve journal yesterday          # Open yesterday's entry
pensieve journal --date 2025-11-20  # Open specific date
```

**3. Calendar Navigation**
```bash
pensieve journal --week            # Show this week's entries
pensieve journal --month           # Show this month's entries
pensieve journal list --month 2025-11  # List all November entries
```

**4. Journal-Specific Search**
```bash
pensieve journal search "productivity"  # Search only journal entries
```

**5. Habit & Streak Tracking**
```bash
pensieve journal streak            # Show current writing streak (consecutive days)
pensieve journal stats             # Show statistics (total entries, longest streak, etc.)
```

### Journal Entry Template
```markdown
---
id: "20251125"
title: "Journal Entry - November 25, 2025"
type: "journal"
date: "2025-11-25"
created: "2025-11-25 08:30:00"
tags: [journal, daily]
mood: ""
energy_level: 0
habits_completed: []
gratitude: []
---

# November 25, 2025

## Morning Reflection 🌅
*What are my intentions for today?*



## Daily Log 📝
*What happened today?*



## Wins 🎯
*What went well?*

-

## Challenges 🤔
*What was difficult?*

-

## Learning 💡
*What did I learn?*



## Gratitude 🙏
*What am I grateful for?*

1.
2.
3.

## Tomorrow's Focus ⭐
*Top 3 priorities for tomorrow*

1.
2.
3.
```

### JournalService Implementation

**Core Operations:**
```typescript
// src/core/services/JournalService.ts
export class JournalService {
  // Get or create today's journal entry
  static async getToday(): Promise<Journal>

  // Get specific date's entry
  static async getByDate(date: Date): Promise<Journal | null>

  // Get yesterday's entry
  static async getYesterday(): Promise<Journal | null>

  // List entries for a date range
  static async listByRange(startDate: Date, endDate: Date): Promise<Journal[]>

  // List entries for a specific month
  static async listByMonth(year: number, month: number): Promise<Journal[]>

  // Get current writing streak
  static async getStreak(): Promise<number>

  // Get journal statistics
  static async getStats(): Promise<JournalStats>

  // Calculate journal file path for a date
  static getJournalPath(date: Date): string
  // Example: journal/2025/11/20251125.md
}

interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  entriesThisMonth: number;
  entriesThisYear: number;
  averageWordsPerEntry: number;
}
```

### Web UI Journal View

**Calendar Interface:**
```
┌─────────────────────────────────────────────────────┐
│ Journal - November 2025                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat                 │
│                   1●   2●   3    4                  │
│   5    6●   7●   8    9●  10   11                  │
│  12   13●  14●  15●  16   17   18                  │
│  19   20   21   22●  23●  24   25●                 │
│  26   27   28   29   30                            │
│                                                     │
│  ● = Entry exists                                  │
│                                                     │
│  Current Streak: 5 days 🔥                         │
│  Total Entries: 23                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Today's Entry: November 25, 2025                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Markdown editor for today's entry...]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### REST API Endpoints

```typescript
// Journal-specific endpoints
GET    /api/journal/today               // Get today's entry
GET    /api/journal/:date                // Get entry by date (YYYY-MM-DD)
GET    /api/journal/yesterday            // Get yesterday's entry
POST   /api/journal/:date                // Create/update entry for date
GET    /api/journal/range                // Get entries in date range (?start=...&end=...)
GET    /api/journal/month/:year/:month   // Get all entries for month
GET    /api/journal/streak                // Get current writing streak
GET    /api/journal/stats                 // Get journal statistics
GET    /api/journal/search                // Search journal entries (?q=...)
```

### Voice Integration with Journal

**Morning Journaling:**
```bash
# Voice-activated morning reflection
pensieve journal --voice

# User speaks their morning intentions
# JARVIS transcribes and saves to today's journal
# TTS confirms: "Your morning reflection has been saved"
```

**Evening Review with JARVIS:**
```bash
# JARVIS reads today's journal and asks reflection questions
pensieve journal review --voice

# JARVIS: "What did you accomplish today?"
# User responds via voice
# JARVIS: "What are you grateful for?"
# User responds
# JARVIS saves responses to today's journal
```

### Habit Tracking Integration

**Frontmatter-based tracking:**
```yaml
habits_completed:
  - "meditation"
  - "exercise"
  - "reading"
  - "writing"

habits_config:
  - name: "meditation"
    target_frequency: "daily"
  - name: "exercise"
    target_frequency: "3x_week"
```

**CLI habit commands:**
```bash
pensieve journal habit add "meditation"
pensieve journal habit complete "meditation"
pensieve journal habit stats
```

### Implementation Priority

**Phase 1 (Foundation - Week 1-2):**
1. Journal model and schema
2. JournalService with basic CRUD
3. CLI commands: `journal`, `journal today`, `journal --date`
4. Automatic folder/file creation

**Phase 2 (Navigation - Week 3):**
1. List/view commands (`--week`, `--month`)
2. Journal search
3. Date navigation helpers

**Phase 3 (Analytics - Week 4):**
1. Streak calculation
2. Statistics tracking
3. Habit tracking

**Phase 4 (Web UI - Week 7):**
1. Calendar view component
2. Journal editor
3. Streak/stats dashboard

**Phase 5 (Voice Integration - Week 5):**
1. Voice journaling
2. JARVIS-guided reflection
3. TTS playback of entries

### Benefits in Second Brain Context

1. **Separate from PARA**: Journals are temporal, not project/area-based
2. **Daily Reflection**: Supports CODE "Express" step through regular writing
3. **Linking**: Can link journal entries to projects/areas for context
4. **Progressive Summarization**: Weekly/monthly journal summaries
5. **Memory Lane**: Easy to browse past entries by date
6. **Habit Formation**: Encourages daily practice of capturing thoughts

---

## 11. Configuration

### Config File (.pensieve/config.yaml)
```yaml
version: "1.0"
vault_path: "./vault"

defaults:
  capture_folder: "0-inbox"
  date_format: "YYYY-MM-DD HH:mm:ss"
  id_format: "timestamp"

para:
  inbox: "0-inbox"
  projects: "1-projects"
  areas: "2-areas"
  resources: "3-resources"
  archive: "4-archive"
  journal: "journal"

journal:
  auto_create: true           # Auto-create today's entry if missing
  default_template: "journal-daily"
  reminder_time: "09:00"      # Optional daily reminder
  streak_tracking: true       # Track writing streaks

voice:
  tts_script: "_system/script/google_tts.sh"
  default_language: "en-GB"
  voice_chinese: "cmn-TW"

server:
  port: 3000
  host: "localhost"

jarvis:
  agent_en: "jarvis-oral-summarizer_en"
  agent_zh: "jarvis-oral-summarizer_zh_Hant"
  auto_voice: true
```

### Environment Variables (.env)
```bash
NODE_ENV=development
PORT=3000
VAULT_PATH=./vault
GOOGLE_TTS_SCRIPT=_system/script/google_tts.sh
WEB_UI_URL=http://localhost:5173

# Note: CLAUDE_API_KEY is NOT required
# This project uses Claude Code CLI (headless mode) instead
# Authentication is handled automatically by Claude Code subscription
```

---

## 11. Claude Code CLI Architecture & Best Practices

### Overview
This project uses **Claude Code CLI in headless mode** to access JARVIS agents. This section covers implementation details, limitations, and best practices.

### Execution Pattern

**Basic Execution:**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Execute Claude Code with agent trigger
const { stdout } = await execAsync(
  `claude-code --headless < "${promptFile}"`,
  {
    cwd: process.cwd(),
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024
  }
);
```

**Input Methods:**
1. **File input (Recommended)**: `claude-code --headless < prompt.txt`
   - Avoids shell escaping issues
   - Handles multi-line input correctly
   - Safer for user-generated content

2. **Direct string**: `claude-code --headless "prompt"`
   - Simpler for short prompts
   - Requires careful escaping
   - Risk of command injection

### Concurrency Management

**Problem**: Multiple simultaneous Claude Code processes can cause issues
**Solution**: Use ClaudeCodePool to limit concurrency

```typescript
// src/core/utils/ClaudeCodePool.ts
export class ClaudeCodePool {
  private maxConcurrent = 3; // Configurable
  private running = 0;
  private queue: Array<() => void> = [];

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if at max capacity
    while (this.running >= this.maxConcurrent) {
      await this.delay(100);
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global singleton instance
export const claudePool = new ClaudeCodePool();
```

### Error Handling & Retries

```typescript
// src/core/utils/claudeCodeHelpers.ts
export async function retryClaudeCode<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Retry logic error'); // Should never reach here
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage
const summary = await retryClaudeCode(() =>
  jarvisService.summarizeNote(noteId, 'en')
);
```

### Performance Considerations

**Typical Overhead:**
- Process spawn: ~500ms - 1s
- Agent activation: ~1s - 2s
- Response generation: Variable (depends on content)
- **Total**: ~2s - 5s per call

**Optimization Strategies:**
1. **Batch processing**: Group multiple notes, process sequentially
2. **Background jobs**: Use job queue for non-urgent tasks
3. **Caching**: Cache summaries, avoid re-processing
4. **Rate limiting**: Add delays between calls to prevent throttling

### Security Best Practices

**1. Input Sanitization:**
```typescript
function sanitizeForShell(input: string): string {
  // Remove dangerous shell characters
  return input.replace(/[;&|`$()<>]/g, '');
}

// Or better: use file input to avoid shell interpretation
```

**2. Temp File Management:**
```typescript
// Always cleanup temp files
const promptFile = await createPromptFile(content);
try {
  const result = await execAsync(`claude-code --headless < "${promptFile}"`);
  return result;
} finally {
  await fs.unlink(promptFile).catch(() => {}); // Ignore errors
}
```

**3. Timeout Configuration:**
```typescript
// Always set reasonable timeouts
const { stdout } = await execAsync(command, {
  timeout: 60000, // 60 seconds max
  killSignal: 'SIGTERM'
});
```

### Web Server Integration

**Use Job Queue for Background Processing:**

```typescript
// src/web/routes/jarvis.ts
import express from 'express';
import { JarvisService } from '../../core/services/JarvisService';

const router = express.Router();
const jarvisService = new JarvisService();

// Batch summarization with Server-Sent Events (SSE)
router.post('/summarize/batch', async (req, res) => {
  const { noteIds, language = 'en' } = req.body;

  // Setup SSE for progress updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const results = await jarvisService.batchSummarize(
      noteIds,
      language,
      (current, total) => {
        // Send progress update
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        })}\n\n`);
      }
    );

    // Send final results
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      results: Array.from(results.entries())
    })}\n\n`);
    res.end();

  } catch (error) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

export default router;
```

**Web UI Client (React):**
```typescript
// web-ui/src/hooks/useBatchSummarize.ts
export function useBatchSummarize() {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);

  const summarize = async (noteIds: string[], language: string) => {
    const eventSource = new EventSource(
      `/api/jarvis/summarize/batch?noteIds=${noteIds.join(',')}&language=${language}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'progress') {
        setProgress({ current: data.current, total: data.total });
      } else if (data.type === 'complete') {
        setResults(data.results);
        eventSource.close();
      } else if (data.type === 'error') {
        console.error(data.message);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  return { progress, results, summarize };
}
```

### Limitations & Workarounds

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **Process overhead** | 1-2s per call | Use batching, background jobs |
| **No streaming** | Can't show real-time generation | Use SSE for progress updates |
| **Output parsing** | Need to extract agent response | Implement robust parser with fallbacks |
| **Concurrency** | Too many processes = issues | Use ClaudeCodePool (max 3) |
| **Error messages** | CLI errors can be cryptic | Add retry logic with better error messages |
| **No session state** | Each call is independent | Store context in temp files if needed |

### Testing Strategy

**Unit Tests (Mock CLI):**
```typescript
// tests/services/JarvisService.test.ts
import { vi } from 'vitest';
import { JarvisService } from '../../src/core/services/JarvisService';

vi.mock('child_process', () => ({
  exec: vi.fn((cmd, opts, callback) => {
    // Mock Claude Code response
    callback(null, {
      stdout: 'Mocked JARVIS summary',
      stderr: ''
    });
  })
}));

test('summarizeNote should call Claude Code CLI', async () => {
  const service = new JarvisService();
  const summary = await service.summarizeNote('test-note-id', 'en');
  expect(summary).toContain('summary');
});
```

**Integration Tests (Real CLI):**
```typescript
// tests/integration/jarvis.test.ts
test('real Claude Code summarization', async () => {
  const service = new JarvisService();

  // Create a test note
  const note = await NoteService.create({
    title: 'Test Note',
    content: 'This is a test note for summarization.'
  });

  // Summarize with real JARVIS agent
  const summary = await service.summarizeNote(note.id, 'en');

  expect(summary).toBeTruthy();
  expect(summary.length).toBeGreaterThan(0);
}, 30000); // 30 second timeout for real CLI call
```

### Monitoring & Logging

```typescript
// src/core/utils/claudeCodeLogger.ts
export class ClaudeCodeLogger {
  static log(operation: string, noteId: string, duration: number, error?: Error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      noteId,
      duration,
      success: !error,
      error: error?.message
    };

    // Log to file for analysis
    fs.appendFile(
      'logs/claude-code-calls.jsonl',
      JSON.stringify(logEntry) + '\n'
    );

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ClaudeCode] ${operation} (${duration}ms)`, error || '✓');
    }
  }
}

// Usage in JarvisService
async summarizeNote(noteId: string, language: 'en' | 'zh'): Promise<string> {
  const startTime = Date.now();
  try {
    const result = await this.summarizeNoteImpl(noteId, language);
    ClaudeCodeLogger.log('summarize', noteId, Date.now() - startTime);
    return result;
  } catch (error) {
    ClaudeCodeLogger.log('summarize', noteId, Date.now() - startTime, error);
    throw error;
  }
}
```

---

## 12. File Naming Conventions

### Notes
**Pattern:** `YYYYMMDD-HHMMSS-slug.md`
**Example:** `20251125-143052-code-methodology-notes.md`

### Journal Entries (NEW)
**Pattern:** `journal/{yyyy}/{MM}/{yyyyMMdd}.md`
**Example:** `journal/2025/11/20251125.md`
**Folder Structure:**
- Year folders: `2025/`, `2026/`, etc.
- Month subfolders: `01/`, `02/`, ..., `12/`
- Daily files: `20251125.md` (no slug, just date)

### Projects
**Pattern:** `project-<slug>/`
**Example:** `1-projects/project-second-brain-implementation/`

### Areas
**Pattern:** `<area-name>/`
**Example:** `2-areas/health/`

### Resources
**Pattern:** `<topic-slug>/`
**Example:** `3-resources/programming-typescript/`

### Archive
**Pattern:** `YYYY-MM-<original-name>/`
**Example:** `4-archive/2025-11-project-second-brain/`

---

## 12. Testing Strategy

### Unit Tests (Vitest)
- Test Note model validation
- Test frontmatter parsing
- Test ID generation
- Test PARA path validation

### Integration Tests
- Test NoteService CRUD operations
- Test search functionality
- Test link management
- Test distillation workflow

### E2E Tests
- Test complete CLI workflows
- Test web UI user journeys

---

## 13. Critical Files to Implement First

### Priority 1 - Core Foundation
1. **src/core/models/Note.ts** - Core data model
2. **src/core/utils/frontmatterParser.ts** - Essential infrastructure
3. **src/core/services/NoteService.ts** - Business logic

### Priority 2 - CLI Interface
4. **src/cli/index.ts** - CLI entry point and framework
5. **src/cli/commands/capture.ts** - First user-facing feature

**Rationale:** These 5 files form the critical path for basic functionality and establish patterns for all subsequent features.

---

## 14. Success Metrics

### MVP (6 weeks)
- [ ] CLI functional for capture, organize, search
- [ ] PARA folder system working
- [ ] 50+ personal notes organized
- [ ] Basic progressive summarization
- [ ] Read-only web UI

### Full Release (8 weeks)
- [ ] Full web UI with editing
- [ ] JARVIS voice integration working
- [ ] Export features (PDF, HTML)
- [ ] Project/Area dashboards
- [ ] 200+ notes in active use
- [ ] Daily usage by primary user

---

## 15. Potential Challenges & Mitigations

### Challenge: Concurrent edits (CLI + Web)
**Solution:** Implement file locking and conflict resolution UI

### Challenge: Large vault performance (10,000+ notes)
**Solution:** Implement search index caching in SQLite

### Challenge: Wikilink resolution on renames
**Solution:** Use IDs for links, maintain title→ID mapping

### Challenge: JARVIS API rate limits
**Solution:** Request queue with backoff, cache summaries

### Challenge: Mobile access
**Solution:** PWA for web UI, responsive design

---

## Next Steps

1. Review and approve this plan
2. Initialize TypeScript project structure
3. Begin Phase 1 implementation (Foundation)
4. Iterate based on user feedback
