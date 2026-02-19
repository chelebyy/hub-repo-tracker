# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hub Repo Tracker is a full-stack application for tracking GitHub repositories. It monitors commits and releases, organizes repos by categories, highlights updates, and tracks installed vs. latest versions.

**Stack:**
- **Backend:** Fastify 5 + TypeScript + SQLite (better-sqlite3) + Octokit (GitHub API)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Deployment:** Docker Compose with nginx reverse proxy

## Development Commands

### Backend (`backend/`)
```bash
npm run dev        # Development with hot reload (tsx watch) - port 3001
npm run build      # Compile TypeScript to dist/
npm run start      # Production mode (node dist/app.js)
npm run lint       # ESLint
npm run typecheck  # TypeScript check without emit
npm run test       # Vitest (runs tests/backend.test.ts)
```

### Frontend (`frontend/`)
```bash
npm run dev        # Vite dev server on port 3750 (proxies /api to backend)
npm run build      # TypeScript + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build
npm run test       # Vitest (runs tests/frontend.test.tsx)
```

### Docker
```bash
docker-compose up --build   # Build and run both containers
# Frontend: http://localhost:3750 (configurable via PORT env var)
# Backend: internal port 3000, proxied through nginx
```

### Tests
```bash
# Backend tests (from backend/)
npm run test

# Frontend tests (from frontend/)
npm run test
```

## Architecture

### Backend Structure
```
backend/src/
├── app.ts                 # Fastify app entry, plugin registration, routes
├── features/              # Feature-based organization
│   ├── repos/             # Repository CRUD (routes, service, repository, schema, types)
│   ├── sync/              # GitHub sync logic (service, github-client)
│   ├── categories/        # Category management
│   ├── dashboard/         # Dashboard stats endpoint
│   ├── import/            # Folder scanning, version detection
│   ├── backup/            # JSON/SQLite export and restore
│   └── system/            # Path validation utilities
└── shared/
    ├── config/            # Environment config + validation
    ├── db/                # SQLite initialization + migrations
    ├── jobs/              # Scheduled sync job (node-cron)
    ├── middleware/        # Error handling
    └── utils/             # Shared utilities (semver comparison)
```

**Key Patterns:**
- **Layered per feature:** `routes.ts` → `service.ts` → `repository.ts`
- **Schema validation:** AJV schemas in `schema.ts`, shared schemas registered with Fastify
- **Database:** Synchronous SQLite with prepared statements, automatic migrations on startup
- **GitHub API:** Octokit with exponential backoff + rate limit tracking

### Frontend Structure
```
frontend/src/
├── App.tsx               # Main app with providers, state management
├── components/           # UI components (index.ts barrel exports)
│   └── ui/               # shadcn/ui primitives
├── hooks/                # Custom hooks (useRepos, useCategories, use-toast)
├── services/api.ts       # Centralized API client
├── contexts/             # React contexts (ThemeContext)
└── types/                # TypeScript interfaces
```

**Key Patterns:**
- **Path alias:** `@/` maps to `src/`
- **API layer:** Single `api.ts` with typed request wrapper
- **State:** Custom hooks manage API calls + local state (no global state library)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repos` | List repos (query: category, favorite, has_updates, sort, order) |
| POST | `/api/repos` | Add repo by GitHub URL |
| GET | `/api/repos/:id` | Get single repo |
| PUT | `/api/repos/:id` | Full update |
| PATCH | `/api/repos/:id` | Partial update (notes, category_id, local_path) |
| DELETE | `/api/repos/:id` | Remove repo |
| PATCH | `/api/repos/:id/favorite` | Toggle favorite |
| POST | `/api/repos/:id/acknowledge` | Acknowledge release/tag update |
| PATCH | `/api/repos/:id/installed-version` | Update installed version |
| GET | `/api/repos/:id/version-comparison` | Get version diff (installed vs latest) |
| POST | `/api/repos/preview` | Preview repo before adding |
| POST | `/api/repos/detect-version` | Detect project version from local path |
| GET | `/api/owners` | List all owners with repo counts |
| POST | `/api/sync` | Trigger manual sync |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/import/scan` | Scan folder for Git projects |
| POST | `/api/system/validate-path` | Validate filesystem path |
| GET | `/api/backup/export/json` | Export data as JSON |
| GET | `/api/backup/export/sqlite` | Export database file |
| POST | `/api/backup/preview` | Preview backup file contents |
| POST | `/api/backup/import` | Restore from backup (mode: replace/merge) |

## Configuration

### Backend Environment (`.env`)
```env
GITHUB_TOKEN=ghp_xxx        # Required - GitHub Personal Access Token
SYNC_INTERVAL_MINUTES=30    # Sync frequency (min: 5)
PORT=3001                   # Server port (3001 for dev, 3000 for Docker)
NODE_ENV=development
LOG_LEVEL=info              # Optional: trace/debug/info/warn/error
DATABASE_PATH=./data/repos.db
PROJECTS_PATH=./projects    # Optional: for import feature
```

### Database
- SQLite file stored in `backend/data/repos.db` (development) or `/app/data/repos.db` (Docker)
- Tables: `repos`, `categories`, `sync_state`, `version_history`
- Migrations run automatically on startup via `columnExists()` checks in `shared/db/index.ts`

## Development Notes

### Adding a new API endpoint
1. Define types in `features/<feature>/types.ts`
2. Add AJV schema in `features/<feature>/schema.ts`
3. Implement repository method in `features/<feature>/repository.ts`
4. Add business logic in `features/<feature>/service.ts`
5. Create route in `features/<feature>/routes.ts`
6. Register routes in `app.ts` via `await app.register(xxxRoutes)`

### Adding a new frontend component
1. Create component in `components/ComponentName/ComponentName.tsx`
2. Export via `components/ComponentName/index.ts`
3. Import in `App.tsx` or parent component

### Database migrations
- Add new columns via `columnExists()` check in `runMigrations()` (`shared/db/index.ts`)
- New tables go in `initializeDatabase()` CREATE TABLE block
- Foreign keys: `REFERENCES table(id) ON DELETE CASCADE/SET NULL`

### Sync Job Behavior
- Runs immediately on backend startup
- Scheduled via node-cron (default: every 30 minutes)
- Minimum interval: 5 minutes (rate limit protection)
- Tracks commit SHA, release tags, and generic tags to detect updates

### Version Tracking
- `repos.installed_version`: User's locally installed version
- `sync_state.last_release_tag` / `last_tag`: Latest from GitHub
- Version comparison uses semver (`shared/utils/semver.ts`)
- Comparison result: major/minor/patch/none/ahead/unknown
