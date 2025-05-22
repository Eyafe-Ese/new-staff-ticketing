import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import { Product } from '@/types/product';

interface ProductsByCategoryResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Hook to fetch products by category
 * @param categoryId The category ID to fetch products for
 * @param page Current page number
 * @param limit Number of items per page
 * @returns Products data, metadata, and loading state
 */
export function useProductsByCategory(categoryId: string, page: number = 1, limit: number = 10) {
  const fetchProductsByCategory = async (): Promise<ProductsByCategoryResponse> => {
    const response = await api.get(
      `http://localhost:5006/api/products/category?page=${page}&limit=${limit}&categoryId=${categoryId}`
    );
    return response.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productsByCategory', categoryId, page, limit],
    queryFn: fetchProductsByCategory,
    enabled: !!categoryId,
  });

  return {
    products: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError
  };
} 