"use client";

import { useState, useEffect, MouseEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useComplaintCategories } from "@/hooks/useComplaintCategories";
import { useDepartments } from "@/hooks/useDepartments";
import { useComplaintStatuses } from "@/hooks/useComplaintStatuses";
import { Loader2 } from "lucide-react";
import {
  getTickets,
  updateTicketStatus,
  assignTicketToMe,
  reassignTicket,
  forceCloseTicket,
  type Ticket,
  type TicketFilters,
} from "@/utils/ticketApi";

// Define priority options
const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TicketsPage() {
  const { hasRole } = useRoleCheck();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [department, setDepartment] = useState("all");
  const [priority, setPriority] = useState("all");
  const [anonymous, setAnonymous] = useState(false);
  const [search, setSearch] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [, setSelectedTicket] = useState<Ticket | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [assigningTickets, setAssigningTickets] = useState<Record<string, boolean>>({});

  // Fetch data from APIs
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  const { departments, isLoading: departmentsLoading } = useDepartments();
  const { complaintStatuses, isLoading: statusesLoading } = useComplaintStatuses();

  // Prepare filters
  const filters: TicketFilters = {
    status: status !== "all" ? status : undefined,
    category: category !== "all" ? category : undefined,
    department: department !== "all" ? department : undefined,
    priority: priority !== "all" ? priority : undefined,
    search: search || undefined,
    assignedToMe: assignedToMe || undefined,
    anonymous: anonymous || undefined,
    page,
    limit: 10,
  };

  // Add role-based filtering
  if (hasRole("it_officer")) {
    filters.department = "IT";
  } else if (hasRole("hr_admin")) {
    filters.department = "HR";
  }

  // Fetch tickets
  const {
    data: tickets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => getTickets(filters),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ ticketId, statusId }: { ticketId: string; statusId: string }) =>
      updateTicketStatus(ticketId, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      setAssigningTickets(prev => ({ ...prev, [ticketId]: true }));
      try {
        const result = await assignTicketToMe(ticketId);
        return result;
      } finally {
        setAssigningTickets(prev => ({ ...prev, [ticketId]: false }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ ticketId, userId }: { ticketId: string; userId: string }) =>
      reassignTicket(ticketId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ ticketId, reason }: { ticketId: string; reason: string }) =>
      forceCloseTicket(ticketId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setCloseReason("");
      setSelectedTicket(null);
    },
  });

  // Auto-apply filters when they change
  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [status, category, department, priority, search, assignedToMe, anonymous]);

  // Handle clear filters
  const handleClearFilters = () => {
    setStatus("all");
    setCategory("all");
    setDepartment("all");
    setPriority("all");
    setAnonymous(false);
    setSearch("");
    setAssignedToMe(false);
    setPage(1);
  };

  // Handle row click
  const handleRowClick = (ticketId: string) => {
    window.location.href = `/tickets/${ticketId}`;
  };

  // Handle action click
  const handleActionClick = (e: MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Get current page data
  const currentData = tickets?.data || [];

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
                      <TableCell>
                        <span className="font-medium">
                          {(ticket.categoryEntity?.type || "Unknown").toUpperCase()}
                        </span>
                      </TableCell>
                      {hasRole("hr_admin") && (
                        <TableCell>{ticket.departmentEntity?.name || "Unknown"}</TableCell>
                      )}
                      <TableCell>{ticket.assignedTo?.name || "Unassigned"}</TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasRole("it_officer") && (
                        <>
                              {!ticket.assignedTo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e: MouseEvent) =>
                                    handleActionClick(e, () => {
                                      assignMutation.mutate(ticket.id);
                                    })
                                  }
                                  disabled={assigningTickets[ticket.id]}
                                >
                                  {assigningTickets[ticket.id] ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Assigning...
                                    </>
                                  ) : (
                                    "Assign to Me"
                                  )}
                            </Button>
                          )}
                              <Select
                                defaultValue={ticket.statusId}
                                onValueChange={(statusId) => {
                                  statusMutation.mutate({
                                    ticketId: ticket.id,
                                    statusId,
                                  });
                                }}
                              >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                  {complaintStatuses
                                    .filter(status => 
                                      ["IN_PROGRESS", "ON_HOLD", "RESOLVED"].includes(status.code)
                                    )
                                    .map(status => (
                                      <SelectItem key={status.id} value={status.id}>
                                        {status.name}
                              </SelectItem>
                                    ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                          {hasRole("hr_admin") && (
                        <>
                              <Select
                                defaultValue={ticket.statusId}
                                onValueChange={(statusId) => {
                                  statusMutation.mutate({
                                    ticketId: ticket.id,
                                    statusId,
                                  });
                                }}
                              >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                  {complaintStatuses
                                    .filter(status => 
                                      ["NEW", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"].includes(status.code)
                                    )
                                    .map(status => (
                                      <SelectItem key={status.id} value={status.id}>
                                        {status.name}
                              </SelectItem>
                                    ))}
                            </SelectContent>
                          </Select>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e: MouseEvent) =>
                                      handleActionClick(e, () => {
                                        setSelectedTicket(ticket);
                                      })
                                    }
                                  >
                            Reassign
                          </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reassign Ticket</DialogTitle>
                                    <DialogDescription>
                                      Reassign ticket {ticket.id} to another user
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="user">Select User</Label>
                                      <Select
                                        onValueChange={(userId) => {
                                          reassignMutation.mutate({
                                            ticketId: ticket.id,
                                            userId,
                                          });
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {/* TODO: Add user list */}
                                          <SelectItem value="user1">User 1</SelectItem>
                                          <SelectItem value="user2">User 2</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e: MouseEvent) =>
                                      handleActionClick(e, () => {
                                        setSelectedTicket(ticket);
                                      })
                                    }
                                  >
                            Force Close
                          </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Force Close Ticket</DialogTitle>
                                    <DialogDescription>
                                      Close ticket {ticket.id} with a reason
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="reason">Reason</Label>
                                      <Textarea
                                        id="reason"
                                        value={closeReason}
                                        onChange={(e) => setCloseReason(e.target.value)}
                                        placeholder="Enter reason for closing..."
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setCloseReason("");
                                        setSelectedTicket(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => {
                                        if (closeReason.trim()) {
                                          closeMutation.mutate({
                                            ticketId: ticket.id,
                                            reason: closeReason.trim(),
                                          });
                                        }
                                      }}
                                      disabled={!closeReason.trim() || closeMutation.isPending}
                                    >
                                      {closeMutation.isPending ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Closing...
                                        </>
                                      ) : (
                                        "Close Ticket"
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
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
      {tickets?.pagination && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {currentData.length} of {tickets.pagination.total} tickets
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!tickets.pagination.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
          Previous
        </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!tickets.pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
          Next
        </Button>
      </div>
        </div>
      )}
    </div>
  );
}
