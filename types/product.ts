import { Category } from '@/hooks/useCategories';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  stockQty: number;
  images: string[];
  attributes: Record<string, string>;
  featured: boolean;
  featuredSince: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
} 