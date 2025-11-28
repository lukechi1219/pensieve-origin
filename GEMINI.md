# Pensieve - Personal Knowledge Management System

**Pensieve** is a "Second Brain" Knowledge Management System built on Tiago Forte's **CODE methodology** (Capture, Organize, Distill, Express) and organized using the **PARA method** (Projects, Areas, Resources, Archives). It is designed to transform passive information consumption into active creative output.

## Project Overview

*   **Purpose**: To act as an external cognitive system for capturing, organizing, and refining knowledge.
*   **Core Philosophy**: "The second brain is not a 'perfect filing cabinet' but a 'creative launchpad'."
*   **Architecture**: Full-stack application with a Node.js/Express backend, React/Vite frontend, and file-based storage (Markdown/YAML) compatible with Obsidian.
*   **Key Features**:
    *   **PARA Organization**: Structured folders for Projects, Areas, Resources, and Archive.
    *   **Journaling**: Daily entries with mood tracking and habits.
    *   **JARVIS**: Voice-enabled AI assistant (English/Chinese) with Google Cloud TTS.
    *   **Web Dashboard**: Modern React UI for managing notes and projects.

## Tech Stack

### Backend (`_system/`)
*   **Runtime**: Node.js (v18+)
*   **Language**: TypeScript (v5.3)
*   **Framework**: Express.js
*   **Testing**: Vitest
*   **Storage**: Local file system (Markdown files with YAML frontmatter)

### Frontend (`web-ui/`)
*   **Framework**: React (v18+)
*   **Build Tool**: Vite (v7.2)
*   **Styling**: Tailwind CSS (v4)
*   **Language**: TypeScript
*   **Routing**: React Router v6

### AI & Voice
*   **Agent**: Claude Code CLI integration
*   **TTS**: Google Cloud Text-to-Speech API

## Project Structure

```
pensieve-origin/
├── vault/                      # DATA STORAGE (Do not edit manually if server is running)
│   ├── 0-inbox/               # Unsorted captures
│   ├── 1-projects/            # Active projects (short-term)
│   ├── 2-areas/               # Ongoing responsibilities (long-term)
│   ├── 3-resources/           # Reference materials
│   ├── 4-archive/             # Inactive items
│   ├── journal/               # Daily entries (YYYY/MM/YYYYMMDD.md)
│   └── templates/             # Note templates
├── _system/                    # BACKEND API & CORE LOGIC
│   ├── src/
│   │   ├── core/              # Business logic (Models, Services)
│   │   ├── web/               # Express API routes
│   │   └── cli/               # CLI entry point
│   └── script/                # Utility scripts (TTS, setup)
├── web-ui/                     # FRONTEND APPLICATION
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # React components
│   │   └── pages/             # Route pages
└── .claude/agents/             # AI Agent definitions
```

## Key Commands

### Automated Setup & Launch
*   **Initialize Project**: `./init.sh` (Checks prereqs, installs deps, sets up config)
*   **Start Network**: `./start-network.sh` (Interactive launcher for both servers)

### Backend (`cd _system`)
*   **Start Server**: `npm run serve` (Production mode)
*   **Dev Mode**: `npm run dev` (Watch mode)
*   **Build**: `npm run build`
*   **Test**: `npm test`
*   **Lint**: `npm run lint`

### Frontend (`cd web-ui`)
*   **Start Dev Server**: `npm run dev` (Access at `http://localhost:5173`)
*   **Build**: `npm run build`
*   **Preview**: `npm run preview`
*   **Lint**: `npm run lint`

## Development Conventions

*   **Language**: Strict TypeScript usage in both backend and frontend.
*   **Style**:
    *   **Backend**: Functional services pattern (`NoteService`, `JournalService`).
    *   **Frontend**: Functional React components with Hooks.
    *   **Styling**: Utility-first CSS with Tailwind.
*   **Data Integrity**:
    *   Notes **MUST** have YAML frontmatter (ID, title, created, tags, etc.).
    *   File operations should be atomic where possible to prevent race conditions (see `TESTING_STRATEGY.md`).
*   **Testing**:
    *   **Security**: Critical focus on preventing path traversal and command injection (see `TESTING_STRATEGY.md`).
    *   **Concurrency**: File operations must be tested for race conditions.

## Usage Guide

1.  **Capture**: Add raw notes to `0-inbox`.
2.  **Organize**: Move actionable items to `1-projects` or `2-areas`. Move reference info to `3-resources`.
3.  **Distill**: Use Progressive Summarization (Layers 1-4) to refine content.
4.  **Express**: Create output from your projects.

## Documentation References
*   `README.md`: General project overview.
*   `API_DOCUMENTATION.md`: Detailed REST API endpoints.
*   `TESTING_STRATEGY.md`: Comprehensive testing plan including security and concurrency.
*   `CLI_USER_MANUAL.md`: Guide for CLI usage.
