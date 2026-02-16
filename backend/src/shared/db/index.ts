import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { config } from '../config/index.js';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

const dbPath = config.database.path;

// Ensure data directory exists
const dataDir = dirname(dbPath);
mkdirSync(dataDir, { recursive: true });

export const db: DatabaseType = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Check if column exists in table
function columnExists(table: string, column: string): boolean {
  const result = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return result.some(row => row.name === column);
}

// Run migrations for existing tables
function runMigrations(): void {
  // Add notes column to repos if not exists
  if (!columnExists('repos', 'notes')) {
    db.exec('ALTER TABLE repos ADD COLUMN notes TEXT');
  }

  // Add category_id column to repos if not exists
  if (!columnExists('repos', 'category_id')) {
    db.exec('ALTER TABLE repos ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL');
  }

  // Add is_favorite column to repos if not exists
  if (!columnExists('repos', 'is_favorite')) {
    db.exec('ALTER TABLE repos ADD COLUMN is_favorite INTEGER DEFAULT 0');
  }

  // Add tag tracking columns to sync_state if not exists
  if (!columnExists('sync_state', 'last_tag')) {
    db.exec('ALTER TABLE sync_state ADD COLUMN last_tag TEXT');
  }
  if (!columnExists('sync_state', 'last_tag_date')) {
    db.exec('ALTER TABLE sync_state ADD COLUMN last_tag_date TEXT');
  }
  if (!columnExists('sync_state', 'acknowledged_release')) {
    db.exec('ALTER TABLE sync_state ADD COLUMN acknowledged_release TEXT');
  }
  if (!columnExists('sync_state', 'release_notification_active')) {
    db.exec('ALTER TABLE sync_state ADD COLUMN release_notification_active INTEGER DEFAULT 0');
  }

  // Add installed_version column to repos for tracking which version user has installed
  if (!columnExists('repos', 'installed_version')) {
    db.exec('ALTER TABLE repos ADD COLUMN installed_version TEXT');
  }

  // Add local_path column to repos for tracking local folder location
  if (!columnExists('repos', 'local_path')) {
    db.exec('ALTER TABLE repos ADD COLUMN local_path TEXT');
  }
}

// Initialize schema
export function initializeDatabase(): void {
  // Create tables first
  db.exec(`
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id TEXT UNIQUE,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      description TEXT,
      notes TEXT,
      category_id INTEGER,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'custom',
      color TEXT DEFAULT '#6366f1',
      icon TEXT,
      owner_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      repo_id INTEGER PRIMARY KEY,
      last_commit_sha TEXT,
      last_commit_date TEXT,
      last_commit_message TEXT,
      last_commit_author TEXT,
      last_release_tag TEXT,
      last_release_date TEXT,
      last_release_notes TEXT,
      last_tag TEXT,
      last_tag_date TEXT,
      acknowledged_release TEXT,
      release_notification_active INTEGER DEFAULT 0,
      last_sync_at TEXT,
      has_updates INTEGER DEFAULT 0,
      FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS version_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL,
      version_type TEXT NOT NULL,
      version_value TEXT NOT NULL,
      release_notes TEXT,
      detected_at TEXT DEFAULT (datetime('now')),
      acknowledged_at TEXT,
      FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_repos_full_name ON repos(full_name);
    CREATE INDEX IF NOT EXISTS idx_repos_category ON repos(category_id);
    CREATE INDEX IF NOT EXISTS idx_sync_state_has_updates ON sync_state(has_updates);
    CREATE INDEX IF NOT EXISTS idx_version_history_repo ON version_history(repo_id);
  `);

  // Run migrations for existing tables
  runMigrations();
}

export function closeDatabase(): void {
  db.close();
}
