import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface DepartmentsResponse {
  data: Department[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Fetches departments from the API
 * @returns Departments data and loading state
 */
export function useDepartments() {
  const fetchDepartments = async (): Promise<DepartmentsResponse> => {
    const response = await api.get('/departments');
    return response.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  return {
    departments: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError,
    error
  };
} 