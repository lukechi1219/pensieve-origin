# Pensieve CLI User Manual

**Version**: 0.1.0
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Commands Reference](#commands-reference)
   - [Init](#init)
   - [Capture](#capture)
   - [Journal](#journal)
5. [CODE Methodology](#code-methodology)
6. [PARA Organization](#para-organization)
7. [Progressive Summarization](#progressive-summarization)
8. [Tips & Best Practices](#tips--best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

**Pensieve** is a second brain knowledge management system implementing Tiago Forte's **CODE methodology** (Capture, Organize, Distill, Express). It helps you build a personal knowledge base that grows with you, turning information into insight.

### What is a "Second Brain"?

A second brain is an external system for:
- **Capturing** ideas, insights, and information
- **Organizing** knowledge for easy retrieval
- **Distilling** information into actionable insights
- **Expressing** knowledge through creative output

### Core Philosophy

> "Your second brain is not a perfect filing cabinet—it's a creative launchpad."

Pensieve focuses on:
- **Action-oriented** organization (not academic classification)
- **Progressive** refinement (not upfront perfection)
- **Opportunity-based** processing (refine when you revisit)
- **Output-focused** knowledge (value comes from creation)

---

## Installation

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** (comes with Node.js)

### Setup Steps

1. **Clone or download** the Pensieve repository

2. **Navigate to the system directory**:
   ```bash
   cd pensieve-origin/_system
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Configure environment** (optional):
   ```bash
   cp ../.env.example ../.env
   # Edit .env to customize vault path, language, etc.
   ```

6. **Test the CLI**:
   ```bash
   node dist/cli/index.js --help
   ```

### Optional: Global Installation

To use `pensieve` command globally:

```bash
npm link
pensieve --help
```

---

## Getting Started

### Step 1: Initialize Your Vault

Create the folder structure for your knowledge vault:

```bash
pensieve init
```

**Output**:
```
✔ Vault structure created successfully

✓ Created directories:
  - 0-inbox (unsorted captures)
  - 1-projects (2-3 month goals)
  - 2-areas (life domains)
  - 3-resources (reference material)
  - 4-archive (completed projects)
  - journal (daily entries)
  - templates (note templates)

Vault path: /path/to/pensieve-origin/vault
```

### Step 2: Capture Your First Note

Capture a quick thought or idea:

```bash
pensieve capture "Read about Zettelkasten method"
```

**Output**:
```
✔ Note captured successfully

✓ Note ID: 20251125143052
  File: /vault/0-inbox/20251125143052-read-about-zettelkasten-method.md
```

### Step 3: Start Journaling

Create your first journal entry:

```bash
pensieve journal
```

**Output**:
```
✔ Journal entry loaded

✓ Journal: 2025-11-25
  File: journal/2025/11/20251125.md
```

This creates a structured daily journal with sections for reflection, priorities, and gratitude.

---

## Commands Reference

### Init

**Initialize the Pensieve vault structure.**

```bash
pensieve init
```

**Description**:
- Creates PARA folder structure (inbox, projects, areas, resources, archive)
- Creates journal directory with year/month organization
- Creates templates directory
- Safe to run multiple times (checks existing structure)

**Example**:
```bash
$ pensieve init
✔ Vault structure created successfully
```

---

### Capture

**Quick capture a note to your inbox.**

```bash
pensieve capture <text> [options]
```

**Arguments**:
- `<text>` - The content of your note (required)

**Options**:
- `--inspiring` - Mark note as inspiring
- `--useful` - Mark note as useful
- `--personal` - Mark note as personally resonant
- `--surprising` - Mark note as surprising/counter-intuitive
- `-t, --tags <tags>` - Comma-separated tags

**Examples**:

1. **Simple capture**:
   ```bash
   pensieve capture "Ideas from conversation with Sarah about remote work"
   ```

2. **Capture with CODE criteria**:
   ```bash
   pensieve capture "Remote work increases productivity by 13%" --useful --surprising
   ```

3. **Capture with tags**:
   ```bash
   pensieve capture "Learn TypeScript decorators" --tags "learning,typescript,dev"
   ```

4. **Full example**:
   ```bash
   pensieve capture "The best ideas come from constraints" \
     --inspiring \
     --personal \
     --tags "creativity,constraints,innovation"
   ```

**Output**:
```
✔ Note captured successfully

✓ Note ID: 20251125143052
  File: /vault/0-inbox/20251125143052-the-best-ideas-come-from-constraints.md
  Tags: creativity, constraints, innovation
  CODE: inspiring, personal
```

**What Gets Created**:

A markdown file in `0-inbox/` with full frontmatter:

```yaml
---
id: '20251125143052'
title: The best ideas come from constraints
created: '2025-11-25 14:30:52'
modified: '2025-11-25 14:30:52'
tags:
  - creativity
  - constraints
  - innovation
para_folder: inbox
para_path: 0-inbox
distillation_level: 0
is_inspiring: true
is_useful: false
is_personal: true
is_surprising: false
status: active
---
The best ideas come from constraints
```

---

### Journal

**Work with daily journal entries.**

```bash
pensieve journal [options]
pensieve journal [command]
```

#### Base Command: Open/Create Journal Entry

**Options**:
- `-d, --date <date>` - Specific date (YYYY-MM-DD format)

**Examples**:

1. **Open today's journal**:
   ```bash
   pensieve journal
   ```

2. **Open specific date**:
   ```bash
   pensieve journal --date 2025-11-20
   ```

**Output**:
```
✔ Journal entry loaded

✓ Journal: 2025-11-25
  File: journal/2025/11/20251125.md
  Mood: productive
  Energy: 8/10
  Habits: meditation, exercise
```

#### Subcommand: Yesterday

**View yesterday's journal entry.**

```bash
pensieve journal yesterday
```

**Example**:
```bash
$ pensieve journal yesterday
✔ Yesterday's journal loaded

✓ Journal: 2025-11-24
  File: journal/2025/11/20251124.md
  Mood: focused
  Energy: 7/10
```

#### Subcommand: Streak

**Show your current journaling streak.**

```bash
pensieve journal streak
```

**Example**:
```bash
$ pensieve journal streak
✔ Streak calculated

🔥 Current Streak: 7 days
   Keep it up! 💪
```

**How Streaks Work**:
- Counts consecutive days with journal entries
- Starts from today (or yesterday if today has no entry)
- Breaks reset the streak to 0
- Encourages consistent journaling habit

#### Subcommand: Stats

**Show comprehensive journal statistics.**

```bash
pensieve journal stats
```

**Example**:
```bash
$ pensieve journal stats
✔ Statistics calculated

📊 Journal Statistics
   Total Entries: 45
   Current Streak: 7 days
   Longest Streak: 14 days
   Average Energy: 7.2/10
   Most Common Mood: productive
   Total Habits Completed: 156
```

**Metrics Explained**:
- **Total Entries**: Number of journal files created
- **Current Streak**: Consecutive days from today/yesterday
- **Longest Streak**: Best streak ever achieved
- **Average Energy**: Mean energy level (1-10 scale)
- **Most Common Mood**: Most frequently recorded mood
- **Total Habits Completed**: Sum of all habit completions

---

## CODE Methodology

Pensieve implements Tiago Forte's **CODE** framework for knowledge management:

### 1. **Capture (擷取)**

> "Capture what resonates, not what you might need someday."

Use the **4 criteria** to decide what to capture:

| Criteria | Question | Flag |
|----------|----------|------|
| **Inspiring** | Does it inspire me? | `--inspiring` |
| **Useful** | Is it useful now or soon? | `--useful` |
| **Personal** | Does it resonate personally? | `--personal` |
| **Surprising** | Is it counter-intuitive? | `--surprising` |

**Example**:
```bash
pensieve capture "Constraints breed creativity" --inspiring --personal
```

### 2. **Organize (組織)**

> "Organize for actionability, not for academic perfection."

Uses the **PARA method**:

- **Projects**: 2-3 month goals with deadlines
- **Areas**: Ongoing life domains (health, finance, career)
- **Resources**: Topic-based reference material
- **Archive**: Completed projects

**Key Question**: "Which project will I use this note in?"

### 3. **Distill (精煉)**

> "Refine notes progressively when you revisit them."

**Progressive Summarization** (4 layers):

0. **Raw Capture** - Original content as captured
1. **Excerpts** - Extract key paragraphs
2. **Highlights** - Bold important sentences
3. **Summary** - Executive summary (JARVIS can generate)
4. **Remix** - Personal interpretation in your words

**Philosophy**: Add value each time you touch a note (opportunity-based).

### 4. **Express (表達)**

> "Knowledge has value only when creating output."

Build a **portfolio**, not a **notebook**:
- Write articles, create presentations
- Share insights with others
- Use notes to support projects
- Turn learning into action

---

## PARA Organization

### Projects (1-projects/)

**Definition**: Short-term efforts (2-3 months) with clear outcomes.

**Characteristics**:
- Has a deadline
- Has a completion criteria
- Active work required
- Example: "Launch podcast", "Write book proposal"

**Structure**:
```
1-projects/
├── project-launch-podcast/
│   ├── project.yaml          # Metadata & milestones
│   ├── notes/
│   └── assets/
```

### Areas (2-areas/)

**Definition**: Long-term responsibilities without end dates.

**Characteristics**:
- Ongoing maintenance
- Standards to uphold
- No completion date
- Example: "Health", "Finances", "Relationships"

**Common Areas**:
- Career & Skills
- Health & Fitness
- Finance & Wealth
- Relationships & Family
- Personal Development
- Hobbies & Interests

### Resources (3-resources/)

**Definition**: Topics of ongoing interest or reference material.

**Characteristics**:
- Not immediately actionable
- Topic-based organization
- Reference & research
- Example: "Design patterns", "Marketing strategies"

**vs. Areas**: Resources are topics you're interested in; Areas are roles you're responsible for.

### Archive (4-archive/)

**Definition**: Inactive projects and outdated resources.

**When to Archive**:
- Project completed or cancelled
- Resource no longer relevant
- Area no longer active

**Naming Convention**:
```
4-archive/
├── 2025-11-launch-podcast/      # Archived project
└── 2024-06-learning-rust/       # Abandoned project
```

---

## Progressive Summarization

### The 5 Levels

| Level | Name | Description | When to Do |
|-------|------|-------------|------------|
| **0** | Raw | Original capture | Automatic |
| **1** | Excerpts | Key paragraphs extracted | 1st revisit |
| **2** | Highlights | Important sentences bolded | 2nd revisit |
| **3** | Summary | Executive summary | 3rd revisit |
| **4** | Remix | Personal interpretation | When expressing |

### How It Works

1. **Capture** at level 0 (raw)
2. **Don't summarize upfront** - wait until you need it
3. **Add value when you revisit** - progressive refinement
4. **Each layer should take seconds** - not minutes

### Example

**Level 0** (Raw):
```
The Feynman Technique is a learning method named after Nobel Prize-winning
physicist Richard Feynman. It involves four steps: choose a concept, teach
it to someone else, identify gaps in your understanding, and review and
simplify. The technique works because teaching forces you to understand
deeply rather than memorize superficially.
```

**Level 1** (Excerpts):
```
The Feynman Technique involves four steps: choose a concept, teach it to
someone else, identify gaps in your understanding, and review and simplify.
The technique works because teaching forces you to understand deeply.
```

**Level 2** (Highlights):
```
The Feynman Technique involves four steps: **choose a concept, teach it to
someone else, identify gaps, review and simplify**. The technique works
because **teaching forces deep understanding**.
```

**Level 3** (Summary):
```
Feynman Technique: Learn by teaching. Explaining concepts to others reveals
knowledge gaps and forces deep understanding over memorization.
```

**Level 4** (Remix):
```
Want to really understand something? Try teaching it. When I can't explain
a concept simply, I don't understand it yet. This approach transformed how
I learn programming—now I always explain new concepts to colleagues.
```

---

## Tips & Best Practices

### Daily Workflow

**Morning Routine**:
```bash
# 1. Open today's journal
pensieve journal

# 2. Review yesterday's priorities
pensieve journal yesterday

# 3. Check your streak for motivation
pensieve journal streak
```

**Throughout the Day**:
```bash
# Quick captures as thoughts arise
pensieve capture "Idea from meeting..." --useful --tags "work"
pensieve capture "Article: The Power of Now" --inspiring --tags "reading"
```

**Evening Review**:
```bash
# Update journal with reflections
pensieve journal

# Review statistics weekly
pensieve journal stats
```

### Capturing Best Practices

1. **Capture immediately** - Don't wait for the "perfect" moment
2. **Use your own words** - Paraphrase for better retention
3. **One idea per note** - Makes notes more reusable
4. **Be generous with tags** - Easier to filter later
5. **Mark CODE criteria** - Signals emotional resonance

### Common Mistakes to Avoid

❌ **Don't**: Capture everything "just in case"
✅ **Do**: Capture what resonates (use CODE criteria)

❌ **Don't**: Organize upfront perfectly
✅ **Do**: Capture to inbox, organize when needed

❌ **Don't**: Summarize immediately
✅ **Do**: Wait until you revisit (progressive approach)

❌ **Don't**: Build a "perfect notebook"
✅ **Do**: Create outputs using your notes

### File Naming Conventions

Pensieve automatically generates filenames:

**Pattern**: `YYYYMMDDHHMMSS-slug.md`

**Examples**:
- `20251125143052-read-about-zettelkasten-method.md`
- `20251125143109-remote-work-increases-productivity.md`

**Benefits**:
- Chronological sorting
- Unique IDs prevent conflicts
- Human-readable slugs

---

## Troubleshooting

### Common Issues

#### Issue: "Vault not initialized"

**Error**:
```
✖ Vault not initialized. Run "pensieve init" first.
```

**Solution**:
```bash
pensieve init
```

#### Issue: "Invalid date format"

**Error**:
```
✖ Invalid date format. Use YYYY-MM-DD
```

**Solution**:
```bash
# Wrong
pensieve journal --date 11/25/2025

# Correct
pensieve journal --date 2025-11-25
```

#### Issue: "Cannot find module"

**Error**:
```
Error: Cannot find module '/Users/.../dist/cli/index.js'
```

**Solution**:
```bash
cd _system
npm run build
```

#### Issue: "Command not found: pensieve"

**Temporary Fix**:
```bash
node _system/dist/cli/index.js <command>
```

**Permanent Fix**:
```bash
cd _system
npm link
```

### Getting Help

**View command help**:
```bash
pensieve --help                # General help
pensieve capture --help        # Capture command help
pensieve journal --help        # Journal command help
```

**Check version**:
```bash
pensieve --version
```

---

## Configuration Reference

### Environment Variables (.env)

Located at: `pensieve-origin/.env`

```bash
# Vault Configuration
VAULT_PATH=./vault

# Language Settings
DEFAULT_LANGUAGE=en           # Options: en, zh

# Voice Settings (future use)
TTS_SCRIPT_PATH=./_system/script/google_tts.sh
DEFAULT_TTS_VOICE_EN=en-GB-Standard-B
DEFAULT_TTS_VOICE_ZH=cmn-TW-Standard-B

# Web Server (future use)
WEB_PORT=3000
WEB_HOST=localhost

# Claude Code CLI (future use)
CLAUDE_CODE_MAX_CONCURRENT=3
CLAUDE_CODE_TIMEOUT=60000

# Journal Settings
JOURNAL_AUTO_CREATE=true
JOURNAL_DEFAULT_TEMPLATE=daily-reflection

# PARA Settings
AUTO_ARCHIVE_COMPLETED_PROJECTS=false
```

---

## Appendix A: Command Quick Reference

| Command | Description |
|---------|-------------|
| `pensieve init` | Initialize vault structure |
| `pensieve capture <text>` | Quick capture to inbox |
| `pensieve capture --inspiring` | Mark as inspiring |
| `pensieve capture --useful` | Mark as useful |
| `pensieve capture --personal` | Mark as personal |
| `pensieve capture --surprising` | Mark as surprising |
| `pensieve capture -t "tag1,tag2"` | Add tags |
| `pensieve journal` | Open today's journal |
| `pensieve journal --date YYYY-MM-DD` | Open specific date |
| `pensieve journal yesterday` | View yesterday |
| `pensieve journal streak` | Show streak |
| `pensieve journal stats` | Show statistics |

---

## Appendix B: Keyboard Shortcuts

### Shell Aliases (Optional)

Add to your `.bashrc` or `.zshrc`:

```bash
# Pensieve shortcuts
alias pv='pensieve'
alias pvc='pensieve capture'
alias pvj='pensieve journal'
alias pvs='pensieve journal streak'

# Quick capture with useful flag
alias pvcu='pensieve capture --useful'

# Open today's journal quickly
alias today='pensieve journal'
```

**Usage**:
```bash
pvc "Quick note" --tags "idea"
pvs
today
```

---

## Appendix C: Resources

### Further Reading

**CODE Methodology**:
- "Building a Second Brain" by Tiago Forte
- [Forte Labs Blog](https://fortelabs.co/)

**PARA Method**:
- [The PARA Method](https://fortelabs.co/blog/para/)

**Progressive Summarization**:
- [Progressive Summarization Guide](https://fortelabs.co/blog/progressive-summarization-a-practical-technique-for-designing-discoverable-notes/)

**Zettelkasten**:
- "How to Take Smart Notes" by Sönke Ahrens

---

## About

**Pensieve** v0.1.0
A second brain knowledge management system implementing the CODE methodology.

Built with:
- Node.js + TypeScript
- Commander.js (CLI framework)
- Chalk + Ora (beautiful terminal output)
- File-based storage (Markdown + YAML)

**License**: MIT

---

*"The purpose of knowledge is not to collect it, but to create with it."*
