import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

interface DepartmentStats {
  open: number;
  resolved: number;
  myOpen: number;
  myResolved: number;
}

interface TicketTimeData {
  date: string;
  tickets: number;
}

interface TicketCategoryData {
  name: string;
  value: number;
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

interface DepartmentDashboardData {
  stats: DepartmentStats;
  ticketsOverTime: TicketTimeData[];
  ticketsByCategory: TicketCategoryData[];
  latestActivity: ActivityData[];
}

interface ApiResponse {
  data: DepartmentDashboardData;
  timestamp: string;
}

export function useDepartmentDashboard() {
  const fetchDashboardData = async (): Promise<DepartmentDashboardData> => {
    const response = await api.get<ApiResponse>('/api/dashboard/department');
    return response.data.data; // Access the nested data property
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['departmentDashboard'],
    queryFn: fetchDashboardData,
  });

  return {
    stats: data?.stats,
    ticketsOverTime: data?.ticketsOverTime || [],
    ticketsByCategory: data?.ticketsByCategory || [],
    latestActivity: data?.latestActivity || [],
    isLoading,
    isError,
    error
  };
} 