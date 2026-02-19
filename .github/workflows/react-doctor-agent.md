---
name: React Doctor Check
env:
  GH_AW_MODEL_DETECTION_COPILOT: gpt-4o
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
---

1. Checkout the repository.
2. Setup Node.js version 20.
3. Install dependencies using `npm ci` or `npm install`.
4. Run `npx react-doctor .` to check for code quality issues.
