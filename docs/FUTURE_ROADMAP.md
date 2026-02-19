# Future Features and Roadmap

This document outlines planned improvements and features to be implemented in future versions of Hub Repo Tracker.

## 📦 Package Distribution (NPX / NPM)

**Objective:** Allow users to run the application with a single command without `git clone` or manual setup.

**Target Command:**

```bash
npx hub-repo-tracker
```

### Current Challenges

The project currently operates as a Monorepo with distinct separation between Frontend (Vite/React) and Backend (Node/Fastify).

- **Frontend:** Runs on port 5173 (Dev) or needs to be built into static files.
- **Backend:** Runs on port 3000.
- **Database:** SQLite file needs to be created/managed in the user's local directory.

### Implementation Strategy

#### 1. Unified Build Process

Instead of running two servers, we will serve the frontend **through** the backend.

- Build the frontend: `cd frontend && npm run build` -> `frontend/dist`
- Copy `frontend/dist` -> `backend/public`
- Update Backend to serve static files from `public/` for non-API routes.

#### 2. CLI Entry Point (`bin`)

- Create a `bin/cli.js` in the backend package.
- Identify user's working directory (`process.cwd()`) to store the SQLite database.
  - *Note:* Do not store DB inside `node_modules`. Use the current folder or user home directory.
- Add `bin` field to `backend/package.json`.

#### 3. Publishing

- Publish the backend package to NPM as `hub-repo-tracker`.
- Users run `npx hub-repo-tracker`.
- The script:
    1. Starts the server on an available port.
    2. Opens the default browser automatically.
    3. Manages the SQLite database file in the user's chosen location.

## 🚀 Other Potential Features

- [ ] **Dependency Update Tracking:** Monitor `package.json` dependencies for updates (V2 concept).
- [ ] **Cross-Platform Tray App:** Electron wrapper to run as a background tray application.
- [ ] **Team Sync:** Sync tracked repos across a team using a shared config/database.
