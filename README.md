# Pensieve

**Your Second Brain - A Knowledge Management System Built on the CODE Methodology**

<div align="center">

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

[English](README.md) | [繁體中文](README_zh_Hant.md)

</div>

---

## What is Pensieve?

Pensieve is a **second brain knowledge management system** implementing Tiago Forte's **CODE methodology** (Capture, Organize, Distill, Express). It transforms you from a passive consumer into an active creator through systematic knowledge processing.

Named after the magical device in Harry Potter that stores and reviews memories, Pensieve helps you build an **external cognitive system** that liberates your mind and amplifies your creative potential.

### Key Philosophy

> The second brain is not a "perfect filing cabinet" but a "creative launchpad."

Start with imperfect captures. Refine opportunistically. Create relentlessly.

---

## The CODE Methodology

CODE represents four sequential steps for transforming information into creative output:

### 1. **Capture** (擷取) - Curate with Resonance

**Core Principle**: Don't "collect everything" - curate what resonates with you.

**Four Capture Standards**:
- ✨ **Inspiring**: Does it spark new ideas?
- 🛠️ **Useful**: Can I apply this in the future?
- ❤️ **Personal**: Does it resonate with my experience?
- 💡 **Surprising**: Does it challenge my existing beliefs?

**Practice**:
- Use a single digital tool for centralized storage
- Capture quickly without immediate categorization
- Record source and context

**Common Mistakes**:
- Information scattered across multiple tools (phone notes, computer notes, bookmarks, screenshots...)
- Trying to remember everything, ending up remembering nothing

### 2. **Organize** (組織) - Action-Centered Structure

**PARA Method**:
- 🎯 **Projects**: Short-term goals to complete within 2-3 months
- 🌱 **Areas**: Ongoing life domains (health, finance, relationships, career...)
- 📚 **Resources**: Topic-based knowledge for future reference
- 📦 **Archive**: Inactive or completed projects

**Core Question**: "Which project will I use this note in?" (not "What category does it belong to?")

**Practice**:
- Organize by actionability, not academic classification
- Avoid overly complex hierarchical structures
- Don't sort all old notes at once (opportunistic organization)

**Common Mistakes**:
- Building a "perfect" classification system that never gets used
- Spending too much time organizing, ignoring actual output

### 3. **Distill** (精煉) - Design for Your Future Self

**Progressive Summarization** (4 Layers):
1. **Layer 0**: Original raw content
2. **Layer 1**: Extract key paragraphs
3. **Layer 2**: Bold important sentences
4. **Layer 3**: Executive summary (JARVIS can generate)
5. **Layer 4**: Personal interpretation in your own words

**Practice**:
- **Opportunistic refinement**: Add a bit of value each time you touch a note
- Don't invest too much effort in perfect structure upfront
- Notes naturally become more refined over time

**Core Concept**:
> Design notes for your future self to reduce cognitive load

**Common Mistakes**:
- Trying to create perfect summaries from the start
- Over-simplifying and losing original context

### 4. **Express** (表達) - Knowledge Has Value Only When Used

**Core Principle**:
- Knowledge only has value when it **creates output**
- Don't wait for perfection to start

**Intermediate Packets**:
- Break projects into reusable components
- Example: 5 key points → presentation → article → course

**Practice**:
- Publish simple versions and iterate continuously
- Build a "portfolio," not a "notebook"
- Sharing and teaching are the best forms of learning

**Common Mistakes**:
- Perfectionism trap ("I'll share when I'm ready")
- Only input without output - notes become a graveyard

---

## Features

### Implemented ✅

- **Dashboard**: Overview with stats cards (inbox, projects, journal streak)
- **PARA Organization**: Navigate through Projects, Areas, Resources, Archive
- **Note Management**: Create, edit, tag, and track distillation levels
- **Journal System**: Daily entries with habit tracking and streak calculation
- **Project Management**: Track active projects with milestones and progress
- **JARVIS Voice Agent**: AI-powered summarization with witty British butler personality
- **Internationalization**: Full bilingual support (English / 繁體中文)
- **Web UI**: Modern React-based interface with real-time updates
- **REST API**: 20+ endpoints for programmatic access

### Coming Soon 🚧

- CLI commands for quick capture and batch operations
- Voice capture with speech-to-text
- Advanced search and filtering
- Analytics and insights dashboard
- Export to multiple formats
- Mobile companion app

---

## Quick Start

### Prerequisites

- macOS (tested on macOS Sequoia 24.4.0)
- [Node.js 18+](https://nodejs.org/)
- [Homebrew](https://brew.sh/)
- Google account (for Text-to-Speech)

### One-Command Installation

```bash
./init.sh
```

This automated script will:
1. ✅ Check prerequisites
2. ☁️ Install Google Cloud SDK
3. 📦 Set up backend dependencies
4. 🎨 Set up frontend dependencies

**Time required**: ~5-10 minutes

### Start the Servers

**Terminal 1 - Backend API:**
```bash
cd _system
npm run serve
```

**Terminal 2 - Frontend:**
```bash
cd web-ui
npm run dev
```

**Open**: http://localhost:5173/

---

## Project Structure

```
pensieve-origin/
├── vault/                      # Your knowledge vault
│   ├── 0-inbox/               # Unsorted captures (start here)
│   ├── 1-projects/            # Active projects (2-3 months)
│   ├── 2-areas/               # Life domains (ongoing)
│   ├── 3-resources/           # Topic-based reference
│   ├── 4-archive/             # Completed projects
│   ├── journal/               # Daily journal entries
│   └── templates/             # Note templates
├── _system/                    # Backend (Node.js + TypeScript)
│   ├── src/core/              # Business logic
│   ├── src/web/               # Express REST API
│   └── script/                # Utility scripts
├── web-ui/                     # Frontend (React + Vite)
│   ├── src/api/               # API client
│   ├── src/components/        # React components
│   └── src/pages/             # Page components
└── .claude/agents/             # JARVIS voice agents
```

---

## The PARA Method in Practice

### Projects (1-projects/)
**Definition**: Short-term goals with deadlines (2-3 months)

**Example**: `1-projects/project-second-brain/`

**Characteristics**:
- Has a clear end date
- Has specific deliverables
- Requires active attention

### Areas (2-areas/)
**Definition**: Long-term responsibilities with no end date

**Examples**: `2-areas/health/`, `2-areas/career/`, `2-areas/relationships/`

**Characteristics**:
- Ongoing maintenance
- Standard to uphold
- Never "complete"

### Resources (3-resources/)
**Definition**: Topics of interest for reference

**Examples**: `3-resources/programming/`, `3-resources/productivity/`

**Characteristics**:
- Not immediately actionable
- May be useful someday
- Reference material

### Archive (4-archive/)
**Definition**: Completed or inactive projects

**Example**: `4-archive/2025-11-project-second-brain/`

**Characteristics**:
- No longer active
- Preserved for reference
- Date-stamped for context

---

## JARVIS Voice Agents

### English JARVIS
```bash
# In Claude Code CLI, type:
Hey JARVIS

# JARVIS responds with witty British butler personality
# Example: "At your service, sir. What shall we tackle today?"

# Deactivate:
Goodbye JARVIS
```

### Chinese JARVIS (老賈)
```bash
# In Claude Code CLI, type:
老賈

# JARVIS responds in Chinese with humor
# Example: "老闆,有什麼需要我效勞的嗎?"

# Deactivate:
再見老賈
```

### Voice Discussion Mode
```bash
# In Claude Code CLI, type:
voice discussion

# Full conversational responses with TTS playback

# Deactivate:
cancel voice discussion
```

---

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Detailed installation and setup guide
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Complete technical specification
- **[CLAUDE.md](CLAUDE.md)** - Developer guidelines and project reference
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - REST API reference
- **[CLI_USER_MANUAL.md](CLI_USER_MANUAL.md)** - CLI commands guide
- **[PROGRESS.md](PROGRESS.md)** - Current implementation status

---

## Technology Stack

**Backend:**
- Node.js 18+ with TypeScript 5.3
- Express.js REST API
- File-based storage (Markdown + YAML)

**Frontend:**
- React 18 + TypeScript
- Vite 7.2 (fast HMR)
- Tailwind CSS v4
- React Router v6

**Voice & AI:**
- Google Cloud Text-to-Speech API
- Claude Code CLI agents

---

## Overall Philosophy

### From Consumer to Creator

Build an **external cognitive system** to:
- Free your mind from remembering everything
- Reduce mental burden
- Focus on creative work
- Accumulate knowledge **compound interest** over time

### Key Insights

1. **Actionability over Categories**: Organize by "which project will I use this in?" not by academic classification
2. **Opportunistic Refinement**: Don't perfect notes upfront; add value each time you touch them
3. **Intermediate Packets**: Break work into reusable components
4. **Imperfect Action**: Start simple, iterate continuously
5. **Output-Oriented**: A second brain is for creating, not just storing

---

## Cost Considerations

**Google Cloud Text-to-Speech API Pricing** (2025):
- First 1 million characters/month: **FREE**
- Standard voices: $4 per 1 million characters
- WaveNet voices: $16 per 1 million characters

**Typical Usage**:
- Average note summary: ~200 characters
- 5,000 summaries/month = 1 million characters (within free tier)

Pensieve uses **Standard voices** to maximize free tier usage.

---

## Contributing

Contributions are welcome! Please ensure:

1. All code follows AGPL-3.0 license terms
2. New dependencies are AGPL-3.0 compatible
3. TypeScript types are properly defined
4. Tests are included for new features
5. Documentation is updated

See [CLAUDE.md](CLAUDE.md) for developer guidelines.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**Key Points**:
- ✅ Free to use, modify, and distribute
- ✅ Must share source code with users
- ✅ **Network copyleft**: If you run a modified version as a web service, you must make the source code available to users
- ❌ Cannot create proprietary/closed-source versions

See [LICENSE](LICENSE) for full details.

For more information: <https://www.gnu.org/licenses/agpl-3.0.html>

---

## Resources

- [Building a Second Brain by Tiago Forte](https://www.buildingasecondbrain.com/)
- [PARA Method Overview](https://fortelabs.com/blog/para/)
- [Progressive Summarization](https://fortelabs.com/blog/progressive-summarization-a-practical-technique-for-designing-discoverable-notes/)
- [Building a Second Brain: Definitive Guide](https://fortelabs.com/blog/basboverview/)

---

## Acknowledgments

This project implements methodologies developed by **Tiago Forte** and his work on Building a Second Brain.

Special thanks to the open source community for the amazing tools that make this project possible.

---

**Philosophy**: The second brain is not a "perfect filing cabinet" but a "creative launchpad."

Start with imperfect captures. Refine opportunistically. Create relentlessly.

**Welcome to your Pensieve journey!** 🧠✨
