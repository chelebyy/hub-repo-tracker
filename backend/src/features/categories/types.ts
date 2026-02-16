export interface Category {
  id: number;
  name: string;
  type: 'custom' | 'owner';
  color: string;
  icon: string | null;
  owner_name: string | null;
  created_at: string;
}

export interface CreateCategoryDto {
  name: string;
  type?: 'custom' | 'owner';
  color?: string;
  icon?: string;
  owner_name?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CategoryWithCount extends Category {
  repo_count: number;
}
