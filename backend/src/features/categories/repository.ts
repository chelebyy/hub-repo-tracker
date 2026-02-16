import { db } from '../../shared/db/index.js';
import type { Category, CreateCategoryDto, UpdateCategoryDto, CategoryWithCount } from './types.js';

function mapCategory(row: unknown): Category {
  return row as Category;
}

export const categoryRepository = {
  findAll(): CategoryWithCount[] {
    const sql = `
      SELECT c.*, COUNT(r.id) as repo_count
      FROM categories c
      LEFT JOIN repos r ON c.id = r.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const rows = db.prepare(sql).all() as CategoryWithCount[];
    return rows;
  },

  findById(id: number): Category | null {
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return row ? mapCategory(row) : null;
  },

  findByName(name: string): Category | null {
    const row = db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    return row ? mapCategory(row) : null;
  },

  create(data: CreateCategoryDto): Category {
    const stmt = db.prepare(`
      INSERT INTO categories (name, type, color, icon, owner_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name,
      data.type || 'custom',
      data.color || '#6366f1',
      data.icon || null,
      data.owner_name || null
    );
    return this.findById(result.lastInsertRowid as number) as Category;
  },

  update(id: number, data: UpdateCategoryDto): Category | null {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }

    if (data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(data.icon);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const stmt = db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  },

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  hasRepos(id: number): boolean {
    const row = db.prepare('SELECT COUNT(*) as count FROM repos WHERE category_id = ?').get(id) as { count: number };
    return row.count > 0;
  },

  clearRepos(id: number): void {
    const stmt = db.prepare('UPDATE repos SET category_id = NULL WHERE category_id = ?');
    stmt.run(id);
  },
};
