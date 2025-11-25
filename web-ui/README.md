# Pensieve Web UI

React-based web interface for the Pensieve second brain knowledge management system.

## Overview

This is the frontend application for Pensieve, implementing Tiago Forte's CODE methodology (Capture, Organize, Distill, Express) with a modern, bilingual web interface.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.2 (fast HMR, ESM-based)
- **Styling**: Tailwind CSS v4 (Vite plugin, no PostCSS)
- **Routing**: React Router v6
- **State Management**: React Context API
- **Icons**: Lucide React
- **Internationalization**: Custom i18n with React Context

## Features

### Implemented ✅

- **Dashboard**: Overview with stats cards showing inbox count, active projects, journal streak
- **PARA Browser**: Navigate through Projects, Areas, Resources, and Archive folders
- **Note Cards**: Display notes with tags, CODE flags (Inspiring, Useful, Personal, Surprising), and distillation levels
- **Chat System**: JARVIS voice companion integration with chat history
- **Project Management**: View active projects with progress tracking and milestones
- **Journal System**: Daily journal entries with streak tracking
- **Responsive Layout**: Sidebar navigation with modern, clean UI
- **Internationalization**: Full bilingual support (English / 繁體中文)
  - Language switcher in sidebar footer
  - Persistent language preference (localStorage)
  - Locale-aware date formatting
  - Browser language detection

### Coming Soon 🚧

- Note editor with Markdown preview
- Journal calendar view with habit tracking
- Project management interface with milestone editing
- Advanced search and filtering
- JARVIS integration with progress tracking UI
- Analytics and insights dashboard

## Quick Start

### Prerequisites

- Node.js 18+
- Backend API server running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Start development server
npm run dev
```

The application will be available at http://localhost:5173/

## Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Project Structure

```
web-ui/
├── src/
│   ├── api/              # API client layer
│   │   ├── client.ts     # Base HTTP client
│   │   ├── notes.ts      # Notes API
│   │   ├── journals.ts   # Journals API
│   │   ├── projects.ts   # Projects API
│   │   └── chats.ts      # Chats API
│   ├── components/       # React components
│   │   ├── Layout.tsx    # Main layout wrapper
│   │   ├── Sidebar.tsx   # Navigation sidebar
│   │   ├── Header.tsx    # Top header with search
│   │   └── LanguageSwitcher.tsx  # Language toggle
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Notes.tsx        # PARA folder browser
│   │   ├── NoteDetail.tsx   # Individual note view
│   │   ├── Chats.tsx        # Chat history
│   │   ├── ChatDetail.tsx   # Chat conversation
│   │   ├── Journals.tsx     # Journal stats
│   │   ├── Projects.tsx     # Project list
│   │   └── ProjectDetail.tsx # Project view
│   ├── i18n/            # Internationalization
│   │   ├── I18nContext.tsx    # Context provider
│   │   └── translations.ts    # Translation strings
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Shared types
│   ├── lib/             # Utility functions
│   │   └── utils.ts     # Helper utilities
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles + Tailwind
├── public/              # Static assets
├── .env                 # Environment variables
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Tailwind CSS v4

This project uses **Tailwind CSS v4** with the Vite plugin (NOT PostCSS).

### Key Differences from v3:

- ❌ No `tailwind.config.js` file
- ❌ No `postcss.config.js` file
- ❌ No `@tailwind` directives
- ✅ Use `@import "tailwindcss"` in CSS
- ✅ Configure via Vite plugin
- ✅ Automatic content detection
- ✅ 5x faster full builds, 100x faster incremental builds

### Configuration

**vite.config.ts**:
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),  // Must come before react()
    react(),
  ],
})
```

**src/index.css**:
```css
@import "tailwindcss";
```

## Internationalization (i18n)

The application supports English and Traditional Chinese (繁體中文).

### Usage in Components

```typescript
import { useI18n } from '../i18n/I18nContext';

function MyComponent() {
  const { t, locale } = useI18n();

  return (
    <div>
      <h1>{t.dashboard.title}</h1>
      <p>{new Date().toLocaleDateString(locale === 'zh_Hant' ? 'zh-TW' : 'en-US')}</p>
    </div>
  );
}
```

### Adding Translations

Edit `src/i18n/translations.ts`:

```typescript
export const translations = {
  en: {
    mySection: {
      title: 'My Title',
      description: 'My description',
    },
  },
  zh_Hant: {
    mySection: {
      title: '我的標題',
      description: '我的描述',
    },
  },
} as const;
```

## API Integration

The frontend communicates with the backend API via REST endpoints.

### API Client Configuration

Set the API URL in `.env`:

```bash
VITE_API_URL=http://localhost:3000/api
```

### Example API Usage

```typescript
import { notesApi } from './api';

// List notes in inbox
const response = await notesApi.list('inbox');
console.log(response.items); // Array of notes

// Get specific note
const note = await notesApi.get('20251125143052');
```

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow existing patterns for consistency
- Use functional components with hooks
- Prefer named exports over default exports
- Use `type` keyword for type-only imports

### Component Guidelines

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use React Context for global state
- Implement proper loading and error states
- Add TypeScript types for all props

### Styling Guidelines

- Use Tailwind utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Use lucide-react for icons
- Keep custom CSS to a minimum

## Troubleshooting

### Tailwind CSS Issues

If you see "trying to use tailwindcss directly as a PostCSS plugin" error:

```bash
# Remove old packages
npm uninstall tailwindcss postcss autoprefixer

# Install Tailwind v4
npm install -D tailwindcss @tailwindcss/vite

# Remove old config files
rm -f tailwind.config.js postcss.config.js
```

### API Connection Issues

If the frontend can't connect to the backend:

1. Check backend is running: http://localhost:3000/health
2. Verify `VITE_API_URL` in `.env`
3. Check browser console for CORS errors
4. Restart both servers after config changes

## Contributing

When adding new features:

1. Add API client functions in `src/api/`
2. Create TypeScript types in `src/types/`
3. Build page components in `src/pages/`
4. Add translations to `src/i18n/translations.ts`
5. Update this README if needed

## Related Documentation

- [Project Root README](../QUICKSTART.md) - Full system documentation
- [API Documentation](../API_DOCUMENTATION.md) - Backend API reference
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [PROGRESS.md](../PROGRESS.md) - Implementation status

## License

AGPL-3.0 - See [LICENSE](../LICENSE) for details.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

**Important**: If you modify this software and make it available over a network (e.g., as a web service), you must make the source code of your modified version available to users.
