import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  department?: string;
  isAnonymous?: boolean;
}

interface AdminStats {
  totalHRComplaints: number;
  assignedComplaints: number;
  reportedComplaints: number;
  unassignedComplaints: number;
  complaintsByStatus: {
    [key: string]: number;
  };
  complaintsByPriority: {
    [key: string]: number;
  };
  complaintsByCategory: {
    [key: string]: number;
  };
  assignedTickets: Ticket[];
  reportedTickets: Ticket[];
  unassignedTickets: Ticket[];
  recentActivity: ActivityData[];
}

interface ActivityData {
  type: 'new_ticket' | 'status_change' | 'comment';
  user: string;
  subject: string;
  time: string;
  color: string;
  icon: string;
  status?: string;
}

interface ApiResponse {
  data: AdminStats;
  timestamp: string;
}

export function useAdminDashboard() {
  const fetchDashboardData = async (): Promise<AdminStats> => {
    const response = await api.get<ApiResponse>('/dashboard/hr-admin');
    return response.data.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: fetchDashboardData,
  });

  return {
    stats: data,
    isLoading,
    isError,
    error
  };
} 