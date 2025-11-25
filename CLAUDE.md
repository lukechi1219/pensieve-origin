# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **Backend**: Node.js/TypeScript
- **Storage**: File-based (Markdown + YAML frontmatter)
- **CLI**: Commander.js with rich TUI
- **Web**: Express API + Vite/React frontend
- **Voice**: Google Cloud TTS + Claude Code agents
- **AI Integration**: Claude Code CLI (headless mode) for JARVIS agents

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
├── vault/                      # Knowledge vault (PARA + Journal)
│   ├── 0-inbox/               # Unsorted captures
│   ├── 1-projects/            # Active projects (2-3 month timeframe)
│   ├── 2-areas/               # Life domains (no end date)
│   ├── 3-resources/           # Topic-based reference
│   ├── 4-archive/             # Completed projects
│   ├── journal/               # Date-organized journal (journal/yyyy/MM/yyyyMMdd.md)
│   └── templates/             # Note templates
├── src/
│   ├── core/                  # Business logic
│   │   ├── models/           # Note, Journal, Project, Area models
│   │   ├── services/         # NoteService, JournalService, JarvisService, etc.
│   │   └── utils/            # ClaudeCodePool, frontmatterParser, etc.
│   ├── cli/                   # CLI commands
│   └── web/                   # Express server & API
├── web-ui/                    # Vite + React frontend
├── _system/script/            # System scripts (google_tts.sh)
└── .claude/agents/            # JARVIS and voice agents
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

## Development Commands

### When TypeScript Project is Initialized

```bash
# Development
npm run dev              # Watch mode with tsx
npm run build            # Compile TypeScript
npm run test             # Run tests with Vitest

# CLI usage
pensieve init                           # Initialize vault
pensieve capture "text"                 # Quick capture
pensieve journal                        # Open today's journal
pensieve journal --date 2025-11-20      # Specific date
pensieve distill summarize <id> --voice # JARVIS summary with TTS
pensieve voice capture                  # Voice-to-text capture

# Web server
npm run serve            # Start Express API (port 3000)
cd web-ui && npm run dev # Start Vite dev server (port 5173)
```

### Current State (Pre-Implementation)

```bash
# View implementation plan
cat IMPLEMENTATION_PLAN.md

# View CODE methodology reference
cat plan.md

# Test Google TTS
_system/script/google_tts.sh "Hello, testing TTS" "en-GB"

# Activate JARVIS for interactive testing
# In Claude Code: "Hey JARVIS, summarize this note..."
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

## Implementation Phases

See `IMPLEMENTATION_PLAN.md` for detailed 9-week timeline:

1. **Week 1**: Foundation (CLI + basic note system)
2. **Week 2**: PARA organization
3. **Week 3**: Search & navigation
4. **Week 4**: Progressive summarization + JARVIS
5. **Week 5**: Voice capture
6. **Week 6**: Web backend API
7. **Week 7-8**: Web frontend
8. **Week 9**: Export & polish

**Current Phase**: Pre-implementation (project planning complete)

---

## Reference Documentation

- `IMPLEMENTATION_PLAN.md` - Complete technical specification
- `plan.md` - CODE methodology philosophy (Chinese)
- `.claude/agents/` - JARVIS and voice agent configurations
- `_system/script/google_tts.sh` - TTS integration script
