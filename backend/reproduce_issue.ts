import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

console.log('--- DB REPRODUCTION SCRIPT ---');
console.log('Current CWD:', process.cwd());

// Simulate config logic locally since we can't import config easily without transpilation setup sometimes
// But tsx handles imports fine.
const dbPathDefault = path.resolve(process.cwd(), 'data/repos.db');
console.log('Calculated DB Path (process.cwd() + data/repos.db):', dbPathDefault);

const dataDir = path.dirname(dbPathDefault);
console.log('Data Directory:', dataDir);
if (fs.existsSync(dataDir)) {
    console.log('Data directory exists.');
    console.log('Files in data dir:', fs.readdirSync(dataDir));
} else {
    console.log('Data directory DOES NOT exist. This might be the problem if app assumes it does, though app creates it.');
}

try {
    console.log('Attempting to open database...');
    const db = new Database(dbPathDefault, { verbose: console.log });
    console.log('DB connection object created.');

    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    console.log('Tables in DB:', tables.map(t => t.name));

    if (tables.length === 0) {
        console.log('WARNING: Database is empty (no tables). Run migrations logic needed?');
    }

    // Check generic query
    const row = db.prepare('SELECT 1 as val').get();
    console.log('SELECT 1 result:', row);

    if (tables.some(t => t.name === 'repos')) {
        const repos = db.prepare('SELECT * FROM repos LIMIT 1').all();
        console.log('Repos query result:', repos);

        try {
            // Try the query that fails in owners
            const owners = db.prepare(`
              SELECT owner, COUNT(*) as repo_count
              FROM repos
              GROUP BY owner
              ORDER BY repo_count DESC, owner ASC
            `).all();
            console.log('Owners query success:', owners);
        } catch (e) {
            console.error('Owners query FAILED:', e);
        }

        // Test migration logic
        try {
            console.log('Testing migration logic (column check)...');
            const columns = db.prepare("PRAGMA table_info(repos)").all() as { name: string }[];
            console.log('Repos columns:', columns.map(c => c.name));

            const hasNotes = columns.some(c => c.name === 'notes');
            console.log('Has notes column:', hasNotes);
        } catch (e) {
            console.error('Migration check FAILED:', e);
        }
    }

    db.close();
    console.log('DB closed successfully.');

} catch (err) {
    console.error('CRITICAL ERROR:', err);
}
