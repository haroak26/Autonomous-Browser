# Replit.md

## Overview

This is an AI-powered stealth browser application that combines a headless Puppeteer browser with an AI chat assistant. Users can browse the web through a visual viewport that displays screenshots, interact with pages via clicks, and use natural language commands to control the browser. The application features a "stealth mode" design with anti-detection measures for web scraping scenarios.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming (dark "stealth" theme with purple/cyan accents)
- **Animations**: Framer Motion for smooth UI transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with Zod schema validation
- **Browser Automation**: Puppeteer-extra with stealth plugin for anti-detection
- **AI Integration**: OpenAI API via Replit AI Integrations for chat, image generation, and audio processing

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Tables**:
  - `history`: Browser navigation history with screenshots
  - `conversations`: Chat conversation metadata
  - `messages`: Individual chat messages linked to conversations
- **Migrations**: Managed via `drizzle-kit push`

### Key Design Patterns
- **Shared Types**: Zod schemas in `shared/` directory define API contracts used by both frontend and backend
- **API Routes Contract**: `shared/routes.ts` defines all API endpoints with input/output schemas
- **Monorepo Structure**: Client code in `client/`, server in `server/`, shared types in `shared/`
- **Screenshot-based Browsing**: Browser viewport rendered as base64 screenshots rather than embedded iframes

### Browser Control Flow
1. Client requests browser launch via POST `/api/browser/launch`
2. Server spawns headless Chrome with stealth configuration
3. User actions (navigate, click, type) sent to `/api/browser/action`
4. Server executes action and returns updated state with screenshot
5. AI assistant can interpret pages and suggest/execute actions

## External Dependencies

### AI Services (via Replit AI Integrations)
- **OpenAI API**: Powers chat completions, image generation, and audio transcription
- **Environment Variables**:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: API key for OpenAI
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`: Base URL for API requests

### Database
- **PostgreSQL**: Primary data store
- **Environment Variables**:
  - `DATABASE_URL`: Connection string for PostgreSQL

### Browser Automation
- **Puppeteer-extra**: Extended Puppeteer with plugin support
- **Stealth Plugin**: Evades common bot detection mechanisms
- **Chrome**: Requires `/usr/bin/google-chrome-stable` on the system

### Audio Processing
- **ffmpeg**: Required for converting WebM audio to WAV format for speech-to-text

### Key npm Dependencies
- `puppeteer-extra` + `puppeteer-extra-plugin-stealth`: Browser automation
- `drizzle-orm` + `drizzle-zod`: Database ORM and validation
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animations
- Radix UI primitives: Accessible UI components