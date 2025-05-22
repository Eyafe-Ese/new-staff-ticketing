import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

interface StatsData {
  myTickets: number;
  pending: number;
  resolved: number;
  closed: number;
}

interface TicketTimeData {
  date: string;
  tickets: number;
}

interface TicketCategoryData {
  category: string;
  count: number;
}

interface ActivityData {
  type: string;
  user: string;
  subject: string;
  time: string;
  color: string;
  icon: string;
}

interface StaffDashboardData {
  stats: StatsData;
  ticketsOverTime: TicketTimeData[];
  ticketsByCategory: TicketCategoryData[];
  latestActivity: ActivityData[];
}

interface ApiResponse {
  data: StaffDashboardData;
  timestamp: string;
}

export function useStaffDashboard() {
  const fetchDashboardData = async (): Promise<StaffDashboardData> => {
    const response = await api.get<ApiResponse>('/dashboard/staff');
    return response.data.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['staffDashboard'],
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