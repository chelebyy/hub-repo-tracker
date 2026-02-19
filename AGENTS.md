# AGENTS.md - Agentic Coding Guidelines

> Guidelines for AI agents operating in this repository.

---

## Project Overview

**Hub Repo Tracker** - A full-stack web application for tracking GitHub repositories.

| Layer | Technology |
|-------|------------|
| Backend | Fastify + TypeScript + better-sqlite3 |
| Frontend | React 18 + Vite + TailwindCSS + TypeScript |
| DevOps | Docker + Nginx |

**Ports**: Frontend `:3000`, Backend `:3001`, Docker combined `:9999`

---

## Build Commands

### Backend

```bash
cd backend
npm install

# Development (hot reload)
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Frontend

```bash
cd frontend
npm install

# Development (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Docker

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No `any`, no `@ts-ignore`
- Use `interface` for entity types, `type` for unions/aliases
- Use `import type` for type-only imports
- Enable `strict: true` in tsconfig (both projects)

### Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `sync-button.tsx` |
| Components | PascalCase | `RepoCard.tsx` |
| Interfaces | PascalCase | `Repo`, `Category` |
| Functions | camelCase | `getRepos()`, `syncAll()` |
| DB Columns | snake_case | `full_name`, `category_id` |
| JSON/JS Props | camelCase | `fullName`, `categoryId` |

### Import Patterns

**Frontend** (use path alias):
```typescript
import { Repo } from '@/types'
import { api } from '@/services/api'
import RepoCard from '@/components/RepoCard'
```

**Backend** (use relative or package imports):
```typescript
import { db } from '../shared/db/index.js'
import type { Repo } from './types.js'
```

### Component Structure

**Frontend React components**:
- Use default exports
- Co-locate with index file for clean imports
- Use functional components with hooks
- Props should be typed with interfaces

```typescript
// src/components/RepoCard/RepoCard.tsx
interface RepoCardProps {
  repo: Repo
  onSelect: (id: number) => void
}

export default function RepoCard({ repo, onSelect }: RepoCardProps) {
  // ...
}

// src/components/RepoCard/index.ts
export { default } from './RepoCard'
```

### Error Handling

- Always handle API errors with try/catch
- Return meaningful error messages
- Use typed error responses

```typescript
// Frontend
try {
  await api.getRepos()
} catch (err) {
  console.error('Failed to fetch repos:', err)
  // Show user-friendly error
}

// Backend - use Fastify's error handling
fastify.setErrorHandler((error, request, reply) => {
  // Handle validation errors, etc.
})
```

### Database Patterns

- Use `better-sqlite3` with prepared statements
- Use snake_case for column names in SQL
- Map to camelCase in TypeScript interfaces

```typescript
// Backend - repository pattern
const stmt = db.prepare('SELECT * FROM repos WHERE category_id = ?')
return stmt.all(categoryId) as Repo[]
```

---

## Project Structure

```
├── backend/
│   └── src/
│       ├── app.ts              # Fastify entry point
│       ├── features/
│       │   ├── repos/          # Repo CRUD + Preview API
│       │   ├── categories/     # Category CRUD API
│       │   ├── sync/           # GitHub sync service
│       │   └── dashboard/     # Dashboard stats
│       └── shared/
│           ├── config/         # Configuration
│           ├── db/            # SQLite setup
│           └── middleware/    # Error handling
│
├── frontend/
│   └── src/
│       ├── App.tsx            # Main app component
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks
│       ├── services/          # API client
│       ├── types/             # TypeScript types
│       └── contexts/          # React contexts
│
└── data/                      # SQLite database (volume)
```

---

## Key Patterns

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    with_updates: number
    favorites: number
  }
}
```

### Database Migration

The backend auto-runs migrations on startup via `runMigrations()` in `src/shared/db/index.ts`. Add new columns with migration checks:

```typescript
if (!columnExists('repos', 'new_column')) {
  db.exec('ALTER TABLE repos ADD COLUMN new_column TEXT')
}
```

### GitHub API

Use Octokit for GitHub API calls. Rate limiting applies - use token from `GITHUB_TOKEN` env var.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token |
| `SYNC_INTERVAL_MINUTES` | No | Auto-sync interval (default: 30) |
| `PORT` | No | Backend port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `DATABASE_PATH` | No | SQLite file path |

---

## Important Notes

1. **No test framework configured** - Tests would need to be set up (Jest/Vitest for frontend, node:test for backend)
2. **No ESLint flat config** - ESLint 9+ is installed but not configured with project-specific rules
3. **Database volume** - Data persists in `./data/` directory
4. **Dark theme** - Frontend uses CSS variables for theming in `index.css`

---

## Common Tasks

### Add a new API endpoint

1. Create route file in `backend/src/features/{feature}/routes.ts`
2. Create service in `backend/src/features/{feature}/service.ts`
3. Register routes in `backend/src/app.ts`

### Add a new frontend component

1. Create folder in `frontend/src/components/{ComponentName}/`
2. Create `ComponentName.tsx` with default export
3. Create `index.ts` that re-exports the default

### Add database column

1. Add migration in `backend/src/shared/db/index.ts` `runMigrations()`
2. Update TypeScript interfaces in both backend and frontend

---

*Generated for AI agent use. Edit as project evolves.*
