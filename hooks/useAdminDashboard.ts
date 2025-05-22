import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

interface AdminStats {
  open: number;
  resolved: number;
  anonymous: number;
  users: number;
}

interface TicketTimeData {
  date: string;
  tickets: number;
}

interface DepartmentData {
  department: string;
  count: number;
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

interface AdminDashboardData {
  stats: AdminStats;
  ticketsOverTime: TicketTimeData[];
  ticketsByDepartment: DepartmentData[];
  latestActivity: ActivityData[];
}

interface ApiResponse {
  data: AdminDashboardData;
  timestamp: string;
}

export function useAdminDashboard() {
  const fetchDashboardData = async (): Promise<AdminDashboardData> => {
    const response = await api.get<ApiResponse>('/api/dashboard/admin');
    return response.data.data; // Access the nested data property
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: fetchDashboardData,
  });

  return {
    stats: data?.stats,
    ticketsOverTime: data?.ticketsOverTime || [],
    ticketsByDepartment: data?.ticketsByDepartment || [],
    latestActivity: data?.latestActivity || [],
    isLoading,
    isError,
    error
  };
} 