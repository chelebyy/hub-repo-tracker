# GEMINI.md - Hub Repo Tracker Context

> This file provides essential instructional context for AI agents working on the Hub Repo Tracker project.

---

## Project Overview

**Hub Repo Tracker** is a full-stack web application designed to centralize and monitor multiple GitHub repositories. It provides features like automated synchronization of commit and release data, custom categorization, personal notes for each repo, and a modern dashboard for tracking updates.

### Core Technologies
- **Backend**: [Fastify](https://www.fastify.io/) (Node.js framework) with TypeScript.
- **Frontend**: [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/), [TailwindCSS](https://tailwindcss.com/), and [Radix UI](https://www.radix-ui.com/).
- **Database**: [SQLite](https://www.sqlite.org/) via `better-sqlite3`.
- **API Integration**: [Octokit](https://github.com/octokit/octokit.js) for GitHub REST API interactions.
- **DevOps**: [Docker](https://www.docker.com/) and [Nginx](https://www.nginx.com/) for containerization and serving.

### Architecture
- **Backend**: Follows a feature-based modular architecture (located in `backend/src/features/`). Each feature typically includes routes, services, repositories, schemas, and types. A shared directory handles global configuration, database initialization, and middleware.
- **Frontend**: A component-based architecture using React hooks for state management and data fetching. Components are co-located in folders with an `index.ts` for clean imports.
- **Data Persistence**: Data is stored in a SQLite database (`data/repos.db`), managed via a repository pattern on the backend.

---

## Building and Running

### Prerequisites
- Node.js (v18+)
- npm
- Docker (optional)
- **GITHUB_TOKEN**: A GitHub Personal Access Token is required for API sync.

### Local Development
1. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Add your GITHUB_TOKEN to .env
   ```

2. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev       # Starts with tsx watch (hot reload)
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev       # Starts Vite dev server
   ```

### Production Build
- **Backend**: `npm run build` (outputs to `dist/`), then `npm run start`.
- **Frontend**: `npm run build` (outputs to `dist/`).

### Docker Orchestration
```bash
# Start all services (frontend, backend, database)
docker-compose up -d --build

# Stop all services
docker-compose down
```

---

## Development Conventions

### Code Style
- **TypeScript**: Strict mode is enforced. Use `interface` for entity models and `type` for unions/aliases. Prefer `import type` for type-only imports.
- **Naming Conventions**:
  - **Files**: `kebab-case.ts` / `kebab-case.tsx`
  - **Components**: `PascalCase.tsx`
  - **Interfaces/Types**: `PascalCase`
  - **Functions/Variables**: `camelCase`
  - **DB Columns**: `snake_case` (mapped to `camelCase` in application code)

### Component Structure
Each frontend component should reside in its own directory:
```
src/components/RepoCard/
├── RepoCard.tsx    # Component implementation (default export)
└── index.ts        # Re-export: export { default } from './RepoCard'
```

### Database Management
- **Migrations**: Automatically handled on backend startup in `backend/src/shared/db/index.ts`. New columns should be added via migration checks in the `runMigrations()` function.
- **Queries**: Use `better-sqlite3` prepared statements to prevent SQL injection.

### Error Handling
- **Backend**: Centralized error handling using Fastify's `setErrorHandler`.
- **Frontend**: Always use `try/catch` blocks when calling API services and provide user-friendly feedback (e.g., via toasts).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | **Yes** | - | GitHub Personal Access Token |
| `SYNC_INTERVAL_MINUTES` | No | 30 | Interval for automatic repo sync |
| `PORT` | No | 3000 | Backend server port |
| `NODE_ENV` | No | development | runtime environment |
| `DATABASE_PATH` | No | ./data/repos.db | Path to SQLite database file |

---

## Project Status & TODOs
- **Testing**: No formal test suite is currently configured. Setting up Vitest for frontend and `node:test` for backend is a priority.
- **Linting**: ESLint is present but basic. Configuring project-specific rules for ESLint 9+ is recommended.
- **CI/CD**: Basic Docker setup is available; GitHub Actions for automated testing/deployment are not yet implemented.
