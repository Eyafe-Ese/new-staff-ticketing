import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import { Complaint } from './useComplaints';

interface ComplaintByTokenResponse {
  data: Complaint;
}

/**
 * Hook to fetch complaint details using an anonymous tracking token
 * @param token The tracking token to look up
 * @returns The complaint data and query state
 */
export function useComplaintByToken(token: string | null | undefined) {
  return useQuery({
    queryKey: ['complaint-by-token', token],
    queryFn: async (): Promise<Complaint> => {
      if (!token) {
        throw new Error('No token provided');
      }
      
      const response = await api.get<ComplaintByTokenResponse>(`/complaints/tracking/${token}`);
      return response.data.data;
    },
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 