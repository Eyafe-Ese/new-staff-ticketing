"use client";

import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useStaffDashboard } from "@/hooks/useStaffDashboard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useITOfficerDashboard } from "@/hooks/useITOfficerDashboard";
import type { Ticket } from "@/hooks/useAdminDashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RBarChart,
  Bar,
} from "recharts";
import {
  Search,
  Shield,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

// Define proper types for chart data
interface LineChartItem {
  date: string;
  tickets: number;
}

interface BarChartItem {
  [key: string]: string | number;
}

interface ActivityData {
  type: string;
  user: string;
  subject: string;
  time: string;
  color: string;
  icon: string;
  comment?: string;
  status?: string;
}

// Add back the chart components and loading states
function LineChart({ data }: { data: LineChartItem[] }) {
  return (
    <div className="h-40 sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="tickets"
            stroke="#E14206"
            strokeWidth={2}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChart({
  data,
  xKey,
  yKey,
}: {
  data: BarChartItem[];
  xKey: string;
  yKey: string;
}) {
  return (
    <div className="h-40 sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey={yKey} fill="#E14206" />
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="text-center">
        <p className="text-sm sm:text-base text-red-500 mb-4">
          Failed to load dashboard data
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { userRole } = useRoleCheck();

  // Only call the relevant dashboard hook based on role
  const staffDashboard = userRole === "staff" ? useStaffDashboard() : null;
  const adminDashboard = userRole === "hr_admin" ? useAdminDashboard() : null;
  const itOfficerDashboard = userRole === "it_officer" ? useITOfficerDashboard() : null;

  // Add anonymous complaint tracking card
  const AnonymousTrackingCard = () => (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          Track Anonymous Complaint
        </CardTitle>
        <CardDescription>
          Check the status of your anonymous submission
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          Enter your tracking token to see updates on your anonymously submitted
          complaint.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="default" className="w-full">
          <Link href="/track-complaint">
            <Search className="h-4 w-4 mr-2" />
            Track Complaint
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );

  // STAFF VIEW
  if (userRole === "staff") {
    if (!staffDashboard) return null;
    
    const {
      stats,
      ticketsOverTime,
      ticketsByCategory,
      latestActivity,
      isLoading,
      isError,
    } = staffDashboard;

    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState />;

    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0 py-4 sm:py-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome to your staff complaint portal dashboard.
          </p>
          <Button asChild className="bg-primary text-white sm:w-auto w-full">
            <Link href="/tickets/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Complaint
            </Link>
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">My Tickets</CardTitle>
              <CardDescription>Total complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {stats?.myTickets || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Pending</CardTitle>
              <CardDescription>In progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {stats?.pending || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {stats?.resolved || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {stats?.closed || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Charts - full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    My Tickets Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart data={ticketsOverTime} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    My Tickets by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={ticketsByCategory as unknown as BarChartItem[]}
                    xKey="category"
                    yKey="count"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Latest Activity - only visible on mobile */}
            <Card className="lg:hidden">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Latest Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-100">
                  {latestActivity
                    .slice(0, 3)
                    .map((activity: ActivityData, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 py-2">
                        <span
                          className="text-lg sm:text-xl"
                          style={{ color: activity.color }}
                        >
                          {activity.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm truncate">
                            <span className="font-medium text-primary">
                              {activity.user}
                            </span>{" "}
                            {activity.type === "status_changed" &&
                              "changed status of"}
                            {activity.type === "comment_added" &&
                              "commented on"}{" "}
                            <span className="font-medium">
                              {activity.subject}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.time}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full mt-2 text-xs h-8"
                >
                  <Link href="/notifications">View All Activity</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <AnonymousTrackingCard />
          </div>
        </div>

        {/* Latest Activity - hidden on mobile, shown on desktop */}
        <Card className="hidden lg:block">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Latest Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {latestActivity.map((activity: ActivityData, idx: number) => (
                <li key={idx} className="flex items-center gap-3 py-2">
                  <span className="text-xl" style={{ color: activity.color }}>
                    {activity.icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium text-primary">
                        {activity.user}
                      </span>{" "}
                      {activity.type === "status_changed" &&
                        "changed status of"}
                      {activity.type === "comment_added" && "commented on"}{" "}
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // IT OFFICER VIEW
  if (userRole === "it_officer") {
    if (!itOfficerDashboard) return null;
    
    const {
      stats,
      assignedTickets,
      myReportedTickets,
      unassignedTickets,
      recentActivity,
      isLoading,
      isError,
    } = itOfficerDashboard;

    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState />;

    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0 py-4 sm:py-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome to your IT officer dashboard.
          </p>
          <Button asChild className="bg-primary text-white sm:w-auto w-full">
            <Link href="/tickets/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Complaint
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Total IT Complaints
              </CardTitle>
              <CardDescription>All complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {stats?.totalITComplaints || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                Assigned to Me
              </CardTitle>
              <CardDescription>My tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {stats?.assignedToMe || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Unassigned</CardTitle>
              <CardDescription>Pending assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {unassignedTickets.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                My Reported
              </CardTitle>
              <CardDescription>Created by me</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {myReportedTickets.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Tickets Grid - full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              {/* Assigned Tickets */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Assigned to Me
                  </CardTitle>
                  <CardDescription>Recently assigned tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedTickets.slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between p-3 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-medium hover:underline"
                          >
                            {ticket.title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {ticket.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {ticket.priority}
                            </span>
                            <span>{ticket.category}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/tickets/${ticket.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {assignedTickets.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No tickets assigned to you
                      </div>
                    )}
                    {assignedTickets.length > 3 && (
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="/tickets?assigned=me">
                          View all assigned tickets
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Unassigned Tickets */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Unassigned Tickets
                  </CardTitle>
                  <CardDescription>
                    New tickets requiring assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {unassignedTickets.slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between p-3 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-medium hover:underline"
                          >
                            {ticket.title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {ticket.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {ticket.priority}
                            </span>
                            <span>{ticket.category}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/tickets/${ticket.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {unassignedTickets.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No unassigned tickets
                      </div>
                    )}
                    {unassignedTickets.length > 3 && (
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="/tickets?status=new">
                          View all unassigned tickets
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown - only visible on mobile */}
            <Card className="lg:hidden">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(stats?.complaintsByStatus || {}).map(
                    ([status, count]) => (
                      <div key={status} className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {count}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground capitalize">
                          {status.replace("_", " ")}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3 sm:space-y-4">
            {/* Status Breakdown - hidden on mobile, shown on desktop */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats?.complaintsByStatus || {}).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {status.replace("_", " ")}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-100">
                  {recentActivity
                    .slice(0, 5)
                    .map((activity: ActivityData, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 py-2">
                        <span
                          className="text-lg sm:text-xl"
                          style={{ color: activity.color }}
                        >
                          {activity.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm truncate">
                            <span className="font-medium text-primary">
                              {activity.user}
                            </span>{" "}
                            {activity.type === "status_changed" &&
                              "changed status of"}
                            {activity.type === "comment_added" &&
                              "commented on"}
                            {activity.type === "ticket_assigned" && "assigned"}
                            {activity.type === "ticket_created" &&
                              "created"}{" "}
                            <span className="font-medium">
                              {activity.subject}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.time}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
                {recentActivity.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent activity
                  </div>
                )}
                {recentActivity.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-xs h-8"
                    asChild
                  >
                    <Link href="/notifications">View All Activity</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // HR ADMIN VIEW
  if (userRole === "hr_admin") {
    if (!adminDashboard) return null;
    
    const {
      stats,
      isLoading,
      isError,
    } = adminDashboard;

    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState />;

    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-0 py-4 sm:py-0">
        {/* Quick Tools Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">HR Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of all HR complaints and users across the organization.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/users">
                <Shield className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/reports">
                <Search className="h-4 w-4 mr-2" />
                HR Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total HR Complaints</CardTitle>
              <CardDescription>All complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats?.totalHRComplaints || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assigned Complaints</CardTitle>
              <CardDescription>Currently assigned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats?.assignedComplaints || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Unassigned Complaints</CardTitle>
              <CardDescription>Pending assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats?.unassignedComplaints || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reported Complaints</CardTitle>
              <CardDescription>Created by you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats?.reportedComplaints || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Complaints by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(stats?.complaintsByStatus || {}).map(([status, count]) => (
                    <div key={status} className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold text-primary">{count as number}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {status.toLowerCase().replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Complaints by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(stats?.complaintsByPriority || {}).map(([priority, count]) => (
                    <div key={priority} className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold text-primary">{count as number}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {priority.toLowerCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tickets */}
          <div className="space-y-4">
            {/* Assigned Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Tickets</CardTitle>
                <CardDescription>Recently assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.assignedTickets?.slice(0, 3).map((ticket: Ticket) => (
                    <div key={ticket.id} className="flex items-start justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <Link href={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                          {ticket.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {ticket.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tickets/${ticket.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {(!stats?.assignedTickets || stats.assignedTickets.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No tickets assigned to you
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unassigned Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Unassigned Tickets</CardTitle>
                <CardDescription>Requiring assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.unassignedTickets?.slice(0, 3).map((ticket: Ticket) => (
                    <div key={ticket.id} className="flex items-start justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <Link href={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                          {ticket.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {ticket.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {ticket.priority}
                          </span>
                          <span className="text-xs">{ticket.department}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tickets/${ticket.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {(!stats?.unassignedTickets || stats.unassignedTickets.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No unassigned tickets
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If no role matches (logged out), show login page
  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-primary/10">
        {/* Left side with graphics or info */}
      </div>
      <div className="flex-1 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Staff Complaint Portal</h1>
            <p className="text-muted-foreground">
              Login to submit or manage complaints
            </p>
          </div>

          <div className="grid gap-4">
            <Button asChild size="lg">
              <Link href="/login">Login</Link>
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button asChild variant="outline" size="lg">
              <Link href="/tickets/new">Submit New Complaint</Link>
            </Button>

            <AnonymousTrackingCard />
          </div>
        </div>
      </div>
    </div>
  );
}
