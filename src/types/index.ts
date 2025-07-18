export interface PriceItem {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  createdAt: Date;
  lastEditedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';