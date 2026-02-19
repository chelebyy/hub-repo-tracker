---
name: CI Pipeline
env:
  GH_AW_MODEL_DETECTION_COPILOT: gpt-4o
on:
  push:
    branches: [main, master]
    tags: ['v*']
  pull_request:
    branches: [main, master]
secrets:
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
---

1. Checkout the repository.
2. Setup Node.js version 20.
3. Install all dependencies (`npm run install:all`).
4. Run security audit (`npm audit --audit-level=high`), but don't fail the build if issues are found, just log them.
5. For the backend:
    - Run linting (`npm run lint`).
    - Run type checking (`npm run typecheck`).
    - Run tests (`npm test`).
6. For the frontend:
    - Run linting (`npm run lint`).
    - Build the frontend (`npm run build`).
    - Run tests (`npm test`).
7. Verify unified build:
    - Build everything (`npm run build:all` in backend).
    - Check if `dist/public` exists.
8. Verify Docker compose build (`docker compose build`).
9. If a tag starting with 'v' is pushed:
    - Create a release draft using `softprops/action-gh-release@v2`.
    - Publish to NPM (install dependencies, build backend, publish with public access).
