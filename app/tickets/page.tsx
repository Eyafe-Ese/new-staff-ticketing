"use client";

import { useState, useEffect, MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useComplaintCategories } from "@/hooks/useComplaintCategories";
import { useDepartments } from "@/hooks/useDepartments";
import { useComplaintStatuses } from "@/hooks/useComplaintStatuses";
import { Loader2 } from "lucide-react";
import api from "@/utils/api";

// Define ticket interface
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  statusEntity?: {
    code: string;
    name: string;
  };
  priorityEntity?: {
    code: string;
    name: string;
  };
  categoryEntity?: {
    type: string;
  };
  departmentEntity?: {
    name: string;
  };
}

// Define priority options
const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TicketsPage() {
  const { hasRole } = useRoleCheck();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [department, setDepartment] = useState("all");
  const [priority, setPriority] = useState("all");
  const [anonymous, setAnonymous] = useState(false);
  const [search, setSearch] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);

  // Fetch data from APIs
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  const { departments, isLoading: departmentsLoading } = useDepartments();
  const { complaintStatuses, isLoading: statusesLoading } = useComplaintStatuses();

  // Fetch tickets based on filters and role
  const {
    data: tickets,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tickets", status, category, department, priority, search, assignedToMe],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (category !== "all") params.append("category", category);
      if (department !== "all") params.append("department", department);
      if (priority !== "all") params.append("priority", priority);
      if (search) params.append("search", search);
      if (assignedToMe) params.append("assignedToMe", "true");
      if (anonymous) params.append("anonymous", "true");

      // Add role-based filtering
      if (hasRole("it_officer")) {
        params.append("department", "IT");
      } else if (hasRole("hr_admin")) {
        params.append("department", "HR");
      }

      const response = await api.get(
        `/complaints${params.toString() ? `?${params.toString()}` : ""}`
      );
      return response.data;
    },
  });

  // Auto-apply filters when they change
  useEffect(() => {
    refetch();
  }, [status, category, department, priority, search, assignedToMe, anonymous, refetch]);

  // Handle clear filters
  const handleClearFilters = () => {
    setStatus("all");
    setCategory("all");
    setDepartment("all");
    setPriority("all");
    setAnonymous(false);
    setSearch("");
    setAssignedToMe(false);
  };

  // Get current page data
  const currentData = tickets?.data || [];

  // Handle row click
  const handleRowClick = (ticketId: string) => {
    window.location.href = `/tickets/${ticketId}`;
  };

  // Handle action click
  const handleActionClick = (e: MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            {hasRole("it_officer")
              ? "Manage and track IT department tickets"
              : hasRole("hr_admin")
              ? "Manage and track HR department tickets"
              : "View and manage your tickets"}
          </p>
        </div>
        <Button asChild className="bg-primary text-white">
          <Link href="/tickets/new">New Complaint</Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-4 py-4 items-end">
          <div>
            <label className="block text-xs mb-1">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={statusesLoading ? "Loading..." : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Array.isArray(complaintStatuses) &&
                  complaintStatuses.map((status: { id: string; name: string }) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs mb-1">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={categoriesLoading ? "Loading..." : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {complaintCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasRole("hr_admin") && (
            <div>
              <label className="block text-xs mb-1">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={departmentsLoading ? "Loading..." : "Department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs mb-1">Anonymous</label>
            <Button
              variant={anonymous ? "default" : "outline"}
              size="sm"
              onClick={() => setAnonymous((a) => !a)}
            >
              {anonymous ? "Yes" : "No"}
            </Button>
          </div>

          {hasRole("it_officer") && (
            <div>
              <label className="block text-xs mb-1">Assigned To Me</label>
              <Button
                variant={assignedToMe ? "default" : "outline"}
                size="sm"
                onClick={() => setAssignedToMe((a) => !a)}
              >
                {assignedToMe ? "Yes" : "No"}
              </Button>
            </div>
          )}

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs mb-1">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or subject"
              className="w-full"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading tickets...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Error loading tickets. Please try again.
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found.
              <br />
              <Button asChild className="mt-2 bg-primary text-white">
                <Link href="/tickets/new">Create one now</Link>
              </Button>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    {hasRole("hr_admin") && <TableHead>Department</TableHead>}
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((ticket: Ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(ticket.id)}
                    >
                      <TableCell className="max-w-[300px] truncate" title={ticket.title}>
                        {ticket.title}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.statusEntity?.code === "NEW"
                              ? "bg-blue-100 text-blue-800"
                              : ticket.statusEntity?.code === "IN_PROGRESS"
                              ? "bg-yellow-100 text-yellow-800"
                              : ticket.statusEntity?.code === "RESOLVED"
                              ? "bg-green-100 text-green-800"
                              : ticket.statusEntity?.code === "CLOSED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ticket.statusEntity?.name || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.priorityEntity?.code === "URGENT"
                              ? "bg-red-100 text-red-800"
                              : ticket.priorityEntity?.code === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : ticket.priorityEntity?.code === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : ticket.priorityEntity?.code === "LOW"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ticket.priorityEntity?.name || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>{ticket.categoryEntity?.type || "Unknown"}</TableCell>
                      {hasRole("hr_admin") && (
                        <TableCell>{ticket.departmentEntity?.name || "Unknown"}</TableCell>
                      )}
                      <TableCell>{ticket.assignedTo?.name || "Unassigned"}</TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="text-primary hover:underline"
                            onClick={(e: MouseEvent) => handleActionClick(e, () => {})}
                          >
                            View
                          </Link>
                          {hasRole("staff") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Add Comment"
                              onClick={(e: MouseEvent) => handleActionClick(e, () => {
                                // TODO: Implement add comment
                              })}
                            >
                              💬
                            </Button>
                          )}
                          {hasRole("it_officer") && (
                            <>
                              {!ticket.assignedTo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e: MouseEvent) => handleActionClick(e, () => {
                                    // TODO: Implement assign to me
                                  })}
                                >
                                  Assign to Me
                                </Button>
                              )}
                              <Select
                                defaultValue={ticket.status}
                                onValueChange={(value) => {
                                  // TODO: Implement status change
                                }}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="on_hold">On Hold</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          {hasRole("hr_admin") && (
                            <>
                              <Select
                                defaultValue={ticket.status}
                                onValueChange={(value) => {
                                  // TODO: Implement status change
                                }}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="on_hold">On Hold</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e: MouseEvent) => handleActionClick(e, () => {
                                  // TODO: Implement reassign
                                })}
                              >
                                Reassign
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e: MouseEvent) => handleActionClick(e, () => {
                                  // TODO: Implement force close
                                })}
                              >
                                Force Close
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={!tickets?.pagination?.hasPrevious}
          onClick={() => {
            // TODO: Implement pagination
          }}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          disabled={!tickets?.pagination?.hasNext}
          onClick={() => {
            // TODO: Implement pagination
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
