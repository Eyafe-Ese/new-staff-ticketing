'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Loader2, Search, Filter, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/utils/api';

// Define ticket interface
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
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
}

// Define ticket status options
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

// Define priority options
const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function ITTicketsPage() {
  const searchParams = useSearchParams();
  const { userRole } = useRoleCheck();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState(searchParams.get('assigned') || '');

  // Fetch tickets based on filters
  const { data: tickets, isLoading, isError } = useQuery({
    queryKey: ['it-tickets', statusFilter, priorityFilter, assignedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assignedFilter === 'me') params.append('assignedTo', 'me');
      
      const response = await api.get(`/tickets/it?${params.toString()}`);
      return response.data.data;
    },
  });

  // Define columns for the tickets table
  const columns = [
    { key: 'title', title: 'Title' },
    { 
      key: 'status', 
      title: 'Status',
      render: (ticket: Ticket) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {statusOptions.find(s => s.value === ticket.status)?.label || ticket.status}
        </span>
      )
    },
    { 
      key: 'priority', 
      title: 'Priority',
      render: (ticket: Ticket) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {priorityOptions.find(p => p.value === ticket.priority)?.label || ticket.priority}
        </span>
      )
    },
    { key: 'category', title: 'Category' },
    { 
      key: 'assignedTo', 
      title: 'Assigned To',
      render: (ticket: Ticket) => ticket.assignedTo?.name || 'Unassigned'
    },
    { 
      key: 'createdAt', 
      title: 'Created',
      render: (ticket: Ticket) => new Date(ticket.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (ticket: Ticket) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={`/it-tickets/${ticket.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      )
    },
  ];

  // Filter tickets based on search query
  const filteredTickets = tickets?.filter((ticket: Ticket) => 
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <RoleProtectedRoute requiredRole="it_officer" fallbackPath="/">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IT Tickets</h1>
            <p className="text-muted-foreground">Manage and track IT department tickets</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tickets</SelectItem>
                  <SelectItem value="me">Assigned to Me</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-red-500">
                Error loading tickets. Please try again.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredTickets}
                searchQuery={searchQuery}
                onRowClick={(ticket) => window.location.href = `/it-tickets/${ticket.id}`}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtectedRoute>
  );
} 