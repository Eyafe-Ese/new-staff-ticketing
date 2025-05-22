import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface ComplaintStatus {
  id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  isActive: boolean;
}

/**
 * Fetches all complaint statuses from the API
 * @returns Complaint statuses data and loading state
 */
export function useComplaintStatuses() {
  const fetchStatuses = async (): Promise<ComplaintStatus[]> => {
    const response = await api.get('/complaint-statuses');
    
    // Handle different possible response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Check if the data is nested inside a data property
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }
    
    // If we couldn't find an array in the response, return an empty array
    console.warn('Unexpected response format from /complaint-statuses:', response.data);
    return [];
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['complaintStatuses'],
    queryFn: fetchStatuses,
  });

  return {
    complaintStatuses: Array.isArray(data) ? data : [],
    isLoading,
    isError,
    error
  };
} 