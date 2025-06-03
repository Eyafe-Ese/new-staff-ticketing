import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import { Complaint } from "./useComplaints";

interface ComplaintResponse {
  data: Complaint;
  timestamp: string;
}

/**
 * Fetches a single complaint by ID
 * @param id The complaint ID to fetch
 * @returns Complaint data and loading state
 */
export function useComplaint(id: string) {
  const fetchComplaint = async (): Promise<ComplaintResponse> => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["complaint", id],
    queryFn: fetchComplaint,
    enabled: !!id, // Only run query if ID is provided
  });

  return {
    complaint: data?.data || null,
    isLoading,
    isError,
    error,
    refetch,
  };
}
