# Chat Folder

This folder stores chat/conversation logs with date-based organization.

## Structure

```
chat/
├── yyyy/                # Year folder (e.g., 2025)
│   └── MM/             # Month folder (e.g., 11 for November)
│       └── *.md        # Chat logs
└── README.md           # This file
```

## Naming Convention

Chat files should follow this pattern:
- `yyyyMMdd-HHMMSS-topic.md` - For timestamped chats
- `yyyyMMdd-session-name.md` - For named sessions

Example:
- `chat/2025/11/20251125-143052-jarvis-code-review.md`
- `chat/2025/11/20251125-brainstorm-project-ideas.md`

## Purpose

The chat folder is separate from:
- **Journal** (`journal/yyyy/MM/yyyyMMdd.md`) - Personal daily reflections, habits, gratitude
- **PARA** (Projects/Areas/Resources/Archive) - Action-oriented knowledge organization

**Chat folder** is for:
- AI conversation logs
- Technical discussions
- Brainstorming sessions
- Q&A sessions
- Learning conversations

## Usage

1. Conversations are automatically organized by year and month
2. Each chat can have metadata in frontmatter (optional)
3. Use tags to categorize conversations
4. Reference chat logs from notes in PARA folders

## Auto-cleanup

Consider archiving or deleting chat logs older than:
- 3 months for routine conversations
- 6 months for reference conversations
- Keep indefinitely if referenced in PARA notes
