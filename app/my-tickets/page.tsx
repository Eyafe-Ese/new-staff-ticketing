"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useComplaintCategories } from "@/hooks/useComplaintCategories";
import { useComplaintStatuses } from "@/hooks/useComplaintStatuses";
import { useComplaints } from "@/hooks/useComplaints";
import { Loader2 } from "lucide-react";

export default function MyTicketsPage() {
  const [statusId, setStatusId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  // Fetch categories from API
  const { complaintCategories, isLoading: categoriesLoading } = useComplaintCategories();
  
  // Fetch statuses from API
  const { complaintStatuses, isLoading: statusesLoading } = useComplaintStatuses();
  
  // Fetch complaints from API
  const { complaints, meta, isLoading: complaintsLoading, refetch } = useComplaints({
    page,
    limit: 10,
    statusId: statusId !== "all" ? statusId : undefined,
    categoryId: categoryId !== "all" ? categoryId : undefined,
    search: search || undefined,
  });

  // Auto-apply filters when they change
  useEffect(() => {
    setPage(1);
    refetch();
  }, [statusId, categoryId, search, refetch]);

  // Handle pagination
  const handleNextPage = () => {
    if (meta && page < meta.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setStatusId("all");
    setCategoryId("all");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">My Tickets</div>
        <Button asChild className="bg-primary text-white">
          <Link href="/tickets/new">New Complaint</Link>
        </Button>
      </div>
      {/* Filter Bar */}
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
                {Array.isArray(complaintStatuses) && complaintStatuses.map(status => (
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
                {Array.isArray(complaintCategories) && complaintCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.type.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>
        </CardContent>
      </Card>
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {complaintsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading tickets...</span>
            </div>
          ) : complaints.length === 0 ? (
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
                  <th className="p-3 text-left">Ticket ID</th>
                  <th className="p-3 text-left w-[300px]">Title</th>
                  <th className="p-3 text-left w-[150px]">Category</th>
                  <th className="p-3 text-left w-[150px]">Department</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Updated At</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(complaint => (
                  <tr
                    key={complaint.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/my-tickets/${complaint.id}`}
                  >
                    <td className="p-3 font-mono">{complaint.id}</td>
                    <td className="p-3 max-w-[300px] truncate" title={complaint.title || complaint.subject}>
                      {complaint.title || complaint.subject}
                    </td>
                    <td className="p-3 max-w-[150px] truncate" title={complaint.categoryEntity?.type?.toUpperCase() || 'N/A'}>
                      {complaint.categoryEntity?.type?.toUpperCase() || 'N/A'}
                    </td>
                    <td className="p-3 max-w-[150px] truncate" title={complaint.department?.name || 'N/A'}>
                      {complaint.department?.name || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {complaint.statusEntity?.name || complaint.status}
                      </span>
                    </td>
                    <td className="p-3">{new Date(complaint.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * meta.limit + 1} to {Math.min(page * meta.limit, meta.total)} of {meta.total} tickets
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={page >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 