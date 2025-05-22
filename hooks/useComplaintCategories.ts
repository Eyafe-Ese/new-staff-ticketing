import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface ComplaintCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ComplaintCategoriesResponse {
  data: ComplaintCategory[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Fetches complaint categories from the API
 * @returns Complaint categories data and loading state
 */
export function useComplaintCategories() {
  const fetchComplaintCategories = async (): Promise<ComplaintCategoriesResponse> => {
    const response = await api.get('/complaint-categories');
    return response.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['complaintCategories'],
    queryFn: fetchComplaintCategories,
  });

  return {
    complaintCategories: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError,
    error
  };
} 