# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev                  # Start development server on http://localhost:3000
npm run build               # Production build
npm run build:with-prisma   # Production build with Prisma generation
npm run lint                # Run Biome linter
npm run format              # Format code with Biome
```

### Database Management
```bash
npm run setup-db    # Interactive database setup wizard
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema changes to database
npm run db:studio   # Open Prisma Studio GUI
npm run db:test     # Test database connection
```

## Architecture

This is a Next.js 14 App Router application for AI-powered video creation with browser-based editing.

### Core Stack
- **Frontend**: React, TypeScript, Zustand (state), TanStack Query (data fetching)
- **Video**: Remotion for browser-based video composition
- **AI**: fal.ai integration for video/music generation models
- **Database**: PostgreSQL via Prisma ORM + IndexedDB for media caching
- **File Storage**: UploadThing
- **Styling**: Tailwind CSS + Radix UI components

### Key Flows

1. **AI Generation Pipeline**:
   ```
   User Input → fal.ai API → Webhook → Media Storage → Timeline
   ```

2. **Data Architecture**:
   - PostgreSQL: Projects, Tracks, KeyFrames, MediaItems, Characters
   - IndexedDB: Client-side media blob storage
   - Vercel KV: Share functionality

3. **State Management**:
   - Zustand store: `/src/data/store.ts`
   - Project context: React Context API
   - Player state: Remotion integration

### Important Files

- `/src/components/main.tsx` - Application shell
- `/src/components/right-panel.tsx` - AI generation controls (currently modified)
- `/src/components/video/timeline.tsx` - Timeline editor
- `/src/lib/fal.ts` - fal.ai client configuration
- `/src/data/store.ts` - Global state management
- `/prisma/schema.prisma` - Database schema

### Code Style

- Formatter: Biome (NOT ESLint/Prettier)
- Indentation: 2 spaces
- Quotes: Double quotes
- Imports: Organized imports enabled

### Environment Variables

Required in `.env.local`:
```
FAL_KEY=                    # fal.ai API key
UPLOADTHING_TOKEN=          # File upload service
DATABASE_URL=               # PostgreSQL connection
TEMP_USER_ID=dev-user-001   # Temporary user ID

# For share functionality (optional)
KV_URL=
KV_REST_API_TOKEN=
KV_REST_API_URL=
KV_REST_API_READ_ONLY_TOKEN=
```

### Available AI Models

- **Video**: Kling 1.6 Pro, Kling 2.1 (Standard/Pro), Seedance 1.0 Lite
- **Music**: Minimax Music, Stable Audio
- **Voice**: PlayHT TTS v3, PlayAI Dialog, F5 TTS

### Adding New Features

1. **New AI Model**: Update `AVAILABLE_ENDPOINTS` in `/src/lib/fal.ts`
2. **Database Changes**: Edit schema, run `npm run db:push`
3. **UI Components**: Follow patterns in `/src/components/ui/`
