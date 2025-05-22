"use client";

import { useState } from "react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useComplaintCategories } from "@/hooks/useComplaintCategories";
import { useDepartments } from "@/hooks/useDepartments";

// Mock data
const mockTickets = [
  {
    id: "TCK-001",
    subject: "Printer not working",
    category: "IT",
    department: "IT",
    reporter: "You",
    status: "New",
    updatedAt: "2024-06-01",
    anonymous: false,
    assignedToMe: false,
  },
  {
    id: "TCK-002",
    subject: "Salary discrepancy",
    category: "Payroll",
    department: "HR",
    reporter: "Anonymous",
    status: "In Progress",
    updatedAt: "2024-06-02",
    anonymous: true,
    assignedToMe: true,
  },
  {
    id: "TCK-003",
    subject: "Broken chair",
    category: "Facilities",
    department: "Facilities",
    reporter: "Jane Doe",
    status: "Resolved",
    updatedAt: "2024-06-03",
    anonymous: false,
    assignedToMe: false,
  },
];

const statusOptions = ["All", "New", "In Progress", "On Hold", "Resolved", "Closed"];

export default function TicketsPage() {
  const { userRole } = useRoleCheck();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All");
  const [anonymous, setAnonymous] = useState(false);
  const [search, setSearch] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  
  // Fetch categories and departments from API
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  const { departments, isLoading: departmentsLoading } = useDepartments();

  // Filter tickets based on role and filters (mock logic)
  let tickets = mockTickets;
  if (userRole === "staff") {
    tickets = tickets.filter(t => t.reporter === "You");
  } else if (userRole === "department_officer") {
    tickets = tickets.filter(t => t.department === "IT"); // Example: officer in IT
    if (assignedToMe) tickets = tickets.filter(t => t.assignedToMe);
  }
  if (status !== "All") tickets = tickets.filter(t => t.status === status);
  if (category !== "All") tickets = tickets.filter(t => t.category === category);
  if (userRole === "admin" && department !== "All") tickets = tickets.filter(t => t.department === department);
  if (anonymous) tickets = tickets.filter(t => t.anonymous);
  if (search) tickets = tickets.filter(t => t.id.includes(search) || t.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">Tickets</div>
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
                <SelectItem value="All">All</SelectItem>
                {complaintCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {userRole === "admin" && (
            <div>
              <label className="block text-xs mb-1">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={departmentsLoading ? "Loading..." : "Department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-xs mb-1">Anonymous</label>
            <Button variant={anonymous ? "default" : "outline"} size="sm" onClick={() => setAnonymous(a => !a)}>
              {anonymous ? "Yes" : "No"}
            </Button>
          </div>
          {userRole === "department_officer" && (
            <div>
              <label className="block text-xs mb-1">Assigned To Me</label>
              <Button variant={assignedToMe ? "default" : "outline"} size="sm" onClick={() => setAssignedToMe(a => !a)}>
                {assignedToMe ? "Yes" : "No"}
              </Button>
            </div>
          )}
          <div>
            <label className="block text-xs mb-1">Date Range</label>
            <Input type="text" placeholder="Date Range" className="w-36" disabled />
          </div>
          <div>
            <label className="block text-xs mb-1">Search</label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID or subject" className="w-40" />
          </div>
          <Button className="bg-primary text-white">Apply</Button>
          <Button variant="outline" onClick={() => { setStatus("All"); setCategory("All"); setDepartment("All"); setAnonymous(false); setSearch(""); setAssignedToMe(false); }}>Clear</Button>
        </CardContent>
      </Card>
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              You haven&apos;t filed any tickets. <br />
              <Button asChild className="mt-2 bg-primary text-white">
                <Link href="/tickets/new">Create one now</Link>
              </Button>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Ticket ID</th>
                  <th className="p-2 text-left">Subject</th>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Department</th>
                  <th className="p-2 text-left">Reporter</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Updated At</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{ticket.id}</td>
                    <td className="p-2">{ticket.subject}</td>
                    <td className="p-2">{ticket.category}</td>
                    <td className="p-2">{ticket.department}</td>
                    <td className="p-2">{ticket.reporter}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{ticket.status}</span>
                    </td>
                    <td className="p-2">{ticket.updatedAt}</td>
                    <td className="p-2 flex gap-2">
                      <Link href={`/tickets/${ticket.id}`} className="text-primary underline">View</Link>
                      {/* Add role-based actions here */}
                      {userRole === "staff" && (
                        <Button variant="ghost" size="icon" title="Add Comment">
                          💬
                        </Button>
                      )}
                      {userRole === "department_officer" && (
                        <>
                          {!ticket.assignedToMe && <Button variant="outline" size="sm">Assign to Me</Button>}
                          <Select defaultValue={ticket.status}>
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="On Hold">On Hold</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      {userRole === "admin" && (
                        <>
                          <Select defaultValue={ticket.status}>
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="On Hold">On Hold</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">Reassign</Button>
                          <Button variant="destructive" size="sm">Force Close</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {/* Pagination (placeholder) */}
      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm" className="ml-2">Next</Button>
      </div>
    </div>
  );
} 