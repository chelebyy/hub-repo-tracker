# Installation Guide

This guide covers installation on Windows, Linux, and macOS.

## Quick Start

| Method | Port | Command |
|--------|------|---------|
| **Docker** | 3750 | `docker-compose up --build` |
| **npm dev** | 3750 | `npm run dev` (in frontend & backend) |

## Port Configuration

Default port is **3750**. You can change it via environment variable:

```bash
# In .env file
PORT=3750

# Or via command line
PORT=8080 docker-compose up --build
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3750 | Application port (Docker & frontend dev) |
| `BACKEND_PORT` | 3001 | Backend port (npm dev only) |

---

## Linux

### Prerequisites

```bash
# Debian/Ubuntu
sudo apt-get install build-essential python3

# Fedora/RHEL
sudo dnf install gcc-c++ make python3

# Arch Linux
sudo pacman -S base-devel python
```

### Install & Run

```bash
cd backend
npm install
npm run dev
```

### Troubleshooting

If you get native module errors:

```bash
npm run rebuild:native
```

---

## macOS

### Prerequisites

```bash
# Install Xcode Command Line Tools
xcode-select --install
```

### Install & Run

```bash
cd backend
npm install
npm run dev
```

### Apple Silicon (M1/M2/M3) Notes

If you encounter native module issues:

```bash
npm run rebuild:native
```

---

## Docker (All Platforms)

Works consistently across all platforms:

```bash
# Copy environment file
cp .env.example .env

# Edit .env and add your GitHub token
# GITHUB_TOKEN=ghp_your_token_here

# Build and run
docker-compose up --build

# Access at http://localhost:3750
```

---

## Development Mode

Run frontend and backend separately for hot-reload:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev
# Runs on port 3001

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
# Runs on port 3750 (proxies API to 3001)
```

---

## Verification

After installation, verify the native module works:

```bash
node -e "require('better-sqlite3')" && echo "Native module OK"
```

---

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
GITHUB_TOKEN=ghp_your_token_here

# Optional
PORT=3750
SYNC_INTERVAL_MINUTES=30
```
