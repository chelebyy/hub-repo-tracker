# CODEBASE.md

> **Auto-generated project context.** Refreshed on every session start.

---

## Project Info

| Property | Value |
|----------|-------|
| **Project** | `hub-repo-tracker` |
| **Framework** | `node` |
| **Type** | `node` |
| **OS** | Windows |
| **Path** | `C:\Users\muham\OneDrive\Belgeler\All_Project\hub-repo-tracker` |

---

## Project Structure

> **Legend:** `file.ts <- A.tsx, B.tsx` = This file is **imported by** A.tsx and B.tsx.
> Directories with `[N files: ...]` are summarized to reduce size.
> [STATS] Showing 192 files. 10 dirs summarized, 11 dirs excluded (node_modules, etc.)


```
.agents/
  skills/
    maestro/
      .claude-plugin/
        marketplace.json
        plugin.json
      .gitignore
      .mcp.json
      CHANGELOG.md
      LICENSE
      README_tr.md
      SKILL.md
      agents/
        grandmaster.md
      commands/
        maestro.md
      hooks/
        brain-sync.js
        hooks.json
        lib/
          brain.js
          ralph.js
          utils.js
        pre-compact.js
        session-start.js
        stop.js
      package.json ← distribution.test.ts
      skills/
        backend-design/
          SKILL.md
          security-protocols.md
        brainstorming/
          SKILL.md
        browser-extension/
          SKILL.md
          scripts/
            js/
              asset-master.js
              manifest-auditor.js
              persistence-check.js
        clean-code/
          SKILL.md
        code-review-checklist/
          SKILL.md
        debug-mastery/
          SKILL.md
          defense-in-depth.md
          root-cause-tracing.md
        frontend-design/
          SKILL.md
          animation_reference.md
          css_art_reference.md
          frontend_reference.md
          scripts/
            js/
              ux-audit.js
          security-protocols.md
        git-worktrees/
          SKILL.md
        optimization-mastery/
          SKILL.md
        planning-mastery/
          SKILL.md
        prompt-enchaner/
          SKILL.md
        ralph-wiggum/
          SKILL.md
          scripts/
            js/
              ralph-harness.js
              ralph-qa-engine.js
              reflection-loop.js
        tdd-mastery/
          SKILL.md
          testing-anti-patterns.md
        verification-mastery/
          SKILL.md
.claude/
  settings.local.json
  skills/
    agents/
      .claude-plugin/
        marketplace.json
      .github/ [8 files: 6 .yml, 2 .md]
      .gitignore
      LICENSE
      Makefile
      README.md
      docs/ [5 files: 5 .md]
      plugins/ [584 files: 498 .md, 75 .json, 4 .yaml]
      tools/
        requirements.txt
        yt-design-extractor.py
    docker-expert/
      SKILL.md
    docker-expert_temp_1771011296086/
      .DS_Store
      .gitignore
      CATALOG.md
      CHANGELOG.md
      CONTRIBUTING.md
      LICENSE
      README.md
      SECURITY.md
      package-lock.json
      package.json ← distribution.test.ts
      skills/
        .gitignore
        README.md
        docker-expert/
          SKILL.md
        docx
        pdf
        pptx
        xlsx
      skills_index.json
    shadcn-ui_temp_1771021459935/
      .gitignore
      CHANGELOG.md
      CONTRIBUTING.md
      LICENSE
      Makefile
      README.md
      pyproject.toml
    typescript-advanced-types/ [563 files: 400 .md, 29 .njk, 26 .ts]
.github/ [1 files: 1 .yml]
.husky/ [18 files: 17 no-ext, 1 .sh]
.maestro/
  .tech_hash
  brain.jsonl
.serena/
  .gitignore
  project.yml
backend/
  .dockerignore
  .env
  .env.example
  Dockerfile
  LICENSE
  README.md
  eslint.config.mjs
  package-lock.json
  package.json ← distribution.test.ts
  scripts/
    build-unified.js
  src/
    app.ts ← distribution.test.ts
    features/
      backup/
        repository.ts
        routes.ts
        schema.ts
        service.ts
        types.ts
      categories/
        repository.ts
        routes.ts
        schema.ts
        service.ts
        types.ts
      dashboard/
        routes.ts
      filesystem/
        routes.ts
        service.ts
      import/
        routes.ts
        schema.ts
        service.ts
        types.ts
      repos/
        repository.ts
        routes.ts
        schema.ts
        service.ts
        types.ts
      sync/
        github-client.ts
        routes.ts
        service.ts
      system/
        routes.ts
    shared/
      config/
        index.ts ← App.tsx
      db/
        index.ts ← App.tsx
      jobs/
        sync-job.ts
      logger.ts
      middleware/
        error.ts
      utils/
        semver.ts
  tests/ [2 files: 2 .ts]
  tsconfig.json
  vitest.config.ts
docs/ [8 files: 7 .md, 1 .png]
frontend/
  .dockerignore
  Dockerfile
  components.json
  eslint.config.mjs
  index.html
  nginx.conf
  package-lock.json
  package.json ← distribution.test.ts
  postcss.config.js
  src/
    App.tsx ← main.tsx
    components/
      AddRepoModal/
        AddRepoModal.tsx ← index.ts
        index.ts ← App.tsx
      BackupRestoreModal/
        BackupRestoreModal.tsx ← index.ts
        BackupSection.tsx ← BackupRestoreModal.tsx, index.ts
        GeneralSettings.tsx ← BackupRestoreModal.tsx
        RestoreSection.tsx ← BackupRestoreModal.tsx, index.ts
        index.ts ← App.tsx
      CategoryManager/
        CategoryManagerModal.tsx ← App.tsx
      ErrorBoundary/
        ErrorBoundary.tsx ← index.ts
        index.ts ← App.tsx
      FilterBar/
        FilterBar.tsx ← index.ts
        index.ts ← App.tsx
      ImportFromFolderModal/
        ImportFromFolderModal.tsx ← App.tsx
        ServerFileBrowser.tsx ← ImportFromFolderModal.tsx
        index.ts ← App.tsx
      LoadingSkeleton/
        LoadingSkeleton.tsx ← index.ts
        index.ts ← App.tsx
      NoteArea/
        NoteArea.tsx ← index.ts
        index.ts ← App.tsx
      PathInput/
        PathInput.tsx ← index.ts
        index.ts ← App.tsx
      RepoCard/
        RepoCard.tsx ← index.ts
        index.ts ← App.tsx
      RepoList/
        RepoList.tsx ← index.ts
        index.ts ← App.tsx
      Sidebar/
        CategoryItem.tsx ← index.ts, Sidebar.tsx
        OwnerGroup.tsx ← index.ts
        Sidebar.tsx ← index.ts
        index.ts ← App.tsx
      SyncButton/
        SyncButton.tsx ← index.ts
        index.ts ← App.tsx
      VersionDiffBadge/
        VersionDiffBadge.tsx ← index.ts
        index.ts ← App.tsx
      ui/ [21 files: 21 .tsx]
    components_list.txt
    contexts/
      ThemeContext.tsx ← App.tsx
    hooks/
      use-toast.ts ← App.tsx, BackupRestoreModal.tsx, toaster.tsx
      useCategories.ts ← App.tsx
      useDirectoryScanner.ts ← ImportFromFolderModal.tsx
      useRepos.ts ← App.tsx
      useSettings.ts ← GeneralSettings.tsx
    index.css
    lib/
      utils.ts ← App.tsx, AddRepoModal.tsx, ImportFromFolderModal.tsx +26 more
    main.tsx
    services/
      api.ts ← useCategories.ts, useDirectoryScanner.ts, useRepos.ts +7 more
    tests/ [2 files: 1 .tsx, 1 .ts]
    types/
      index.ts ← App.tsx
    utils/
      git-config-parser.ts ← useDirectoryScanner.ts
      manifest-parser.ts ← useDirectoryScanner.ts
  tailwind.config.js
  tsconfig.json
  vite.config.ts
  vitest.config.ts
```


## File Dependencies

> Scanned 173 files

### API Endpoints Used

```
/
/api/feedback
/api/settings
```

### High-Impact Files

*Files imported by multiple other files:*

| File | Imported by |
|------|-------------|
| `src/lib/utils` | 29 files |
| `src/components/ui/button` | 16 files |
| `src/types` | 15 files |
| `src/services/api` | 10 files |
| `backend/src/shared/db/index.js` | 9 files |


---

*Auto-generated by Maestro session hooks.*
