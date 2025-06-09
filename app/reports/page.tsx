"use client";

import { useState } from "react";
import { useReports } from "@/hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "../../components/ui/skeleton";
import { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

function ReportsSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={`overview-card-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(4)].map((_, i) => (
          <Card key={`chart-${i}`}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-specific sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={`breakdown-${i}`} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={`performance-${i}`} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { userRole } = useRoleCheck();
  const [date, setDate] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(),
  });
  const { data: reportData, isLoading } = useReports(
    date.from?.toISOString().split('T')[0] || '',
    date.to?.toISOString().split('T')[0] || ''
  );

  if (!reportData) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            {userRole === "it_officer" ? "IT Support" : "HR"} Reports Dashboard
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <DateRangePicker
            date={date}
            setDate={setDate}
          />
          <Button className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <ReportsSkeleton />
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card key="total-complaints">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalComplaints}</div>
              </CardContent>
            </Card>
            <Card key="resolved">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.resolvedComplaints}</div>
                <p className="text-xs text-muted-foreground">
                  {((reportData.resolvedComplaints / reportData.totalComplaints) * 100).toFixed(1)}% resolution rate
                </p>
              </CardContent>
            </Card>
            <Card key="pending">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.pendingComplaints}</div>
                <p className="text-xs text-muted-foreground">
                  {((reportData.pendingComplaints / reportData.totalComplaints) * 100).toFixed(1)}% pending rate
                </p>
              </CardContent>
            </Card>
            <Card key="avg-resolution">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.averageResolutionTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Average hours to resolve</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Complaints by Priority */}
            <Card key="priority-chart">
              <CardHeader>
                <CardTitle>Complaints by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.complaintsByPriority}
                        dataKey="count"
                        nameKey="priority"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {reportData.complaintsByPriority.map((entry, index) => (
                          <Cell key={`priority-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Complaints by Status */}
            <Card key="status-chart">
              <CardHeader>
                <CardTitle>Complaints by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.complaintsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Resolution Time Distribution */}
            <Card key="resolution-time-chart">
              <CardHeader>
                <CardTitle>Resolution Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.resolutionTimeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Complaints by Department */}
            <Card key="department-chart">
              <CardHeader>
                <CardTitle>Complaints by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.complaintsByDepartment}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role-specific sections */}
          {userRole === "it_officer" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Technical Issues Breakdown */}
              <Card key="technical-issues">
                <CardHeader>
                  <CardTitle>Technical Issues Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">System Complaints</div>
                        <div className="text-2xl font-bold">{reportData.systemComplaints}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Hardware Complaints</div>
                        <div className="text-2xl font-bold">{reportData.hardwareComplaints}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Software Complaints</div>
                        <div className="text-2xl font-bold">{reportData.softwareComplaints}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Network Complaints</div>
                        <div className="text-2xl font-bold">{reportData.networkComplaints}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Officer Performance */}
              <Card key="officer-performance">
                <CardHeader>
                  <CardTitle>Officer Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.officerPerformance?.map((officer, index) => (
                      <div key={`officer-${officer.officerId || index}-${officer.name}`} className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{officer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {officer.resolvedCount} tickets resolved
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {officer.averageResolutionTime.toFixed(1)}h
                            </div>
                            <div className="text-sm text-muted-foreground">avg. resolution time</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* HR Issues Breakdown */}
              <Card key="hr-issues">
                <CardHeader>
                  <CardTitle>HR Issues Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Employee Relations</div>
                        <div className="text-2xl font-bold">{reportData.employeeRelationsComplaints}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Benefits</div>
                        <div className="text-2xl font-bold">{reportData.benefitsComplaints}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Policy</div>
                        <div className="text-2xl font-bold">{reportData.policyComplaints}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Workplace Environment</div>
                        <div className="text-2xl font-bold">{reportData.workplaceEnvironmentComplaints}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Performance */}
              <Card key="admin-performance">
                <CardHeader>
                  <CardTitle>Admin Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.adminPerformance?.map((admin, index) => (
                      <div key={`admin-${admin.adminId || index}-${admin.name}`} className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {admin.resolvedCount} tickets resolved
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {admin.averageResolutionTime.toFixed(1)}h
                            </div>
                            <div className="text-sm text-muted-foreground">avg. resolution time</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
} 