import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import { useRoleCheck } from "./useRoleCheck";

interface ReportData {
  startDate: string;
  endDate: string;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  averageResolutionTime: number;
  complaintsByPriority: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  complaintsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  complaintsByDepartment: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
  resolutionTimeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  // IT specific fields
  systemComplaints?: number;
  hardwareComplaints?: number;
  softwareComplaints?: number;
  networkComplaints?: number;
  securityComplaints?: number;
  commonTechnicalIssues?: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
  averageResponseTime?: number;
  firstTimeResolutionRate?: number;
  escalatedComplaints?: number;
  officerPerformance?: Array<{
    officerId: string;
    name: string;
    resolvedCount: number;
    averageResolutionTime: number;
  }>;
  // HR specific fields
  employeeRelationsComplaints?: number;
  benefitsComplaints?: number;
  policyComplaints?: number;
  workplaceEnvironmentComplaints?: number;
  compensationComplaints?: number;
  commonHRIssues?: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
  complaintsByTenure?: Array<{
    tenure: string;
    count: number;
    percentage: number;
  }>;
  complaintsByEmployeeLevel?: Array<{
    level: string;
    count: number;
    percentage: number;
  }>;
  complaintTrends?: Array<{
    trend: string;
    count: number;
    percentage: number;
  }>;
  adminPerformance?: Array<{
    adminId: string;
    name: string;
    resolvedCount: number;
    averageResolutionTime: number;
  }>;
}

interface ApiResponse {
  data: ReportData;
}

export const useReports = (startDate: string, endDate: string) => {
  const { userRole } = useRoleCheck();
  const reportType = userRole === "it_officer" ? "it" : "hr";

  return useQuery({
    queryKey: ["reports", reportType, startDate, endDate],
    queryFn: async (): Promise<ReportData> => {
      const response = await api.get<ApiResponse>(`/reports/${reportType}`, {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data.data;
    },
    enabled: !!userRole && !!startDate && !!endDate,
  });
}; 