'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { useComplaintCategories } from '@/hooks/useComplaintCategories';
import { useComplaintStatuses } from '@/hooks/useComplaintStatuses';
import { Loader2, Search } from 'lucide-react';
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
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  
  // Fetch categories from API
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  
  // Fetch statuses from API
  const { complaintStatuses, isLoading: statusesLoading } = useComplaintStatuses();
  
  // Fetch tickets based on filters
  const { data: tickets, isLoading, isError, refetch } = useQuery({
    queryKey: ['it-tickets', statusId, categoryId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusId !== 'all') params.append('statusId', statusId);
      if (categoryId !== 'all') params.append('categoryId', categoryId);
      if (search) params.append('search', search);
      
      const response = await api.get(`/complaints/it${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    },
  });

  // Auto-apply filters when they change
  useEffect(() => {
    refetch();
  }, [statusId, categoryId, search, refetch]);

  // Handle clear filters
  const handleClearFilters = () => {
    setStatusId("all");
    setCategoryId("all");
    setSearch("");
  };

  // Get current page data
  const currentData = tickets?.data || [];

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
        <Card className="mb-4">
          <CardContent className="flex flex-wrap gap-3 py-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs mb-1">Search</label>
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by ID or subject" 
                className="w-full"
              />
            </div>
            <div className="w-[140px]">
              <label className="block text-xs mb-1">Status</label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger>
                  <SelectValue placeholder={statusesLoading ? "Loading..." : "All Statuses"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Array.isArray(complaintStatuses) && complaintStatuses.map((status: { id: string; name: string }) => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <label className="block text-xs mb-1">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? "Loading..." : "All Categories"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.isArray(complaintCategories) && complaintCategories.map((cat: { id: string; type: string }) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>
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
                        onClick={() => window.location.href = `/it-tickets/${ticket.id}`}
                      >
                        <TableCell className="max-w-[300px] truncate" title={ticket.title}>
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.statusEntity?.code === 'NEW' ? 'bg-blue-100 text-blue-800' :
                            ticket.statusEntity?.code === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.statusEntity?.code === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                            ticket.statusEntity?.code === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.statusEntity?.name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.priorityEntity?.code === 'URGENT' ? 'bg-red-100 text-red-800' :
                            ticket.priorityEntity?.code === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            ticket.priorityEntity?.code === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.priorityEntity?.code === 'LOW' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.priorityEntity?.name || 'Not Set'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={ticket.categoryEntity?.type?.toUpperCase()}>
                          {ticket.categoryEntity?.type?.toUpperCase()}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={ticket.assignedTo?.name || 'Unassigned'}>
                          {ticket.assignedTo?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/it-tickets/${ticket.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtectedRoute>
  );
} 