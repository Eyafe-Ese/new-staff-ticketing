import api from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

interface ApiResponse {
  data: {
    stats: {
      totalITComplaints: number;
      complaintsByStatus: Record<string, number>;
      complaintsByPriority: Record<string, number>;
      complaintsByCategory: Record<string, number>;
      assignedToMe: number;
    };
    assignedTickets: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      category: string;
      createdAt: string;
      updatedAt: string;
    }>;
    myReportedTickets: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      category: string;
      createdAt: string;
      updatedAt: string;
      isAnonymous: boolean;
    }>;
    unassignedTickets: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      category: string;
      createdAt: string;
      updatedAt: string;
      department: string;
    }>;
    recentActivity: Array<{
      type: string;
      user: string;
      subject: string;
      time: string;
      color: string;
      icon: string;
      comment?: string;
    }>;
  };
}

interface ITOfficerDashboardData {
  stats: ApiResponse['data']['stats'] | undefined;
  assignedTickets: ApiResponse['data']['assignedTickets'];
  myReportedTickets: ApiResponse['data']['myReportedTickets'];
  unassignedTickets: ApiResponse['data']['unassignedTickets'];
  recentActivity: ApiResponse['data']['recentActivity'];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useITOfficerDashboard(): ITOfficerDashboardData {
  const fetchDashboardData = async () => {
    const response = await api.get<ApiResponse>('/dashboard/it-officer');
    return response.data.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['itOfficerDashboard'],
    queryFn: fetchDashboardData,
  });

  return {
    stats: data?.stats,
    assignedTickets: data?.assignedTickets || [],
    myReportedTickets: data?.myReportedTickets || [],
    unassignedTickets: data?.unassignedTickets || [],
    recentActivity: data?.recentActivity || [],
    isLoading,
    isError,
    error
  };
} 