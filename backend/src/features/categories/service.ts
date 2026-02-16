import { categoryRepository } from './repository.js';
import type { CreateCategoryDto, UpdateCategoryDto, CategoryWithCount } from './types.js';
import { createError } from '../../shared/middleware/error.js';

export const categoryService = {
  list(): CategoryWithCount[] {
    return categoryRepository.findAll();
  },

  getById(id: number): CategoryWithCount {
    const category = categoryRepository.findById(id);
    if (!category) {
      throw createError(404, 'NOT_FOUND', 'Category not found');
    }

    const all = categoryRepository.findAll();
    return all.find(c => c.id === id) as CategoryWithCount;
  },

  create(data: CreateCategoryDto): CategoryWithCount {
    const existing = categoryRepository.findByName(data.name);
    if (existing) {
      throw createError(409, 'DUPLICATE', 'Category with this name already exists');
    }

    categoryRepository.create(data);
    return this.getById(categoryRepository.findByName(data.name)!.id);
  },

  update(id: number, data: UpdateCategoryDto): CategoryWithCount {
    const existing = categoryRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Category not found');
    }

    if (data.name && data.name !== existing.name) {
      const nameExists = categoryRepository.findByName(data.name);
      if (nameExists) {
        throw createError(409, 'DUPLICATE', 'Category with this name already exists');
      }
    }

    categoryRepository.update(id, data);
    return this.getById(id);
  },

  delete(id: number): void {
    const existing = categoryRepository.findById(id);
    if (!existing) {
      throw createError(404, 'NOT_FOUND', 'Category not found');
    }

    // Clear category from associated repos instead of blocking delete
    categoryRepository.clearRepos(id);

    categoryRepository.delete(id);
  },
};
