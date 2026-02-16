# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-02-16

### Added

- **Unified Build System**: New script to build both frontend and backend and package them into a single distribution.
- **CI/CD Integration**: GitHub Actions workflow for automated Linting, Typechecking, Security Audits, and Testing.
- **Docker Support**: Verified Docker Compose build process for containerized deployment.
- **GitHub Release Automation**: Automatic drafting of releases when version tags are pushed.

### Fixed

- **Startup Warnings**: Resolved false `GITHUB_TOKEN` warnings by checking both environment variables and the local database.
- **Linting**: Fixed various linting errors and warnings in both backend and frontend.
- **CI Paths**: Corrected test discovery paths for Linux environments in GitHub Actions.

## [1.0.4] - 2026-02-16

### Added

- **Settings UI**: Implemented a new settings modal in the frontend for managing GitHub tokens and other configurations.
- **Database-led Config**: Transitioned from purely env-based configuration to a hybrid model supporting UI-based updates.
- **NPM Distribution**: Prepared the package for global installation via NPM/NPX.

### Fixed

- **UI Consistency**: Improved Dark/Light mode transitions and button responsiveness.

## [1.0.0] - 2026-02-13

### Added

- Initial release of Hub Repo Tracker.
- Local repository scanning.
- GitHub API integration for stars, releases, and commits tracking.
- Dashboard with filtering and sorting capabilities.
