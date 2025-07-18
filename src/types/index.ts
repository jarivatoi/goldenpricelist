export interface PriceItem {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  lastEditedAt?: Date;
}

export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';