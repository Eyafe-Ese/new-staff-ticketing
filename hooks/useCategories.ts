import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Fetches categories from the API
 * @param page Page number
 * @param limit Number of items per page
 * @returns Categories data and loading state
 */
export function useCategories(page: number = 1, limit: number = 100) {
  const fetchCategories = async (): Promise<CategoriesResponse> => {
    const response = await api.get(`http://localhost:5006/api/categories?page=${page}&limit=${limit}`);
    return response.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories', page, limit],
    queryFn: fetchCategories,
  });

  return {
    categories: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError
  };
}

/**
 * Fetches a single category by ID
 * @param id Category ID
 * @returns Category data and loading state
 */
export function useCategory(id: string) {
  const fetchCategory = async (): Promise<Category> => {
    const response = await api.get(`http://localhost:5006/api/categories/${id}`);
    return response.data.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['category', id],
    queryFn: fetchCategory,
    enabled: !!id && id !== 'new',
  });

  return {
    category: data,
    isLoading,
    isError
  };
} 