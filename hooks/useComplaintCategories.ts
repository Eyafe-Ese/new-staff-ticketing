import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface ComplaintCategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  isActive: boolean;
}

export interface ComplaintCategoriesResponse {
  data: ComplaintCategory[];
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
    isLoading,
    isError,
    error
  };
} 