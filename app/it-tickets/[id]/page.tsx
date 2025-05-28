'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Loader2, ArrowLeft, MessageSquare, Upload, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/utils/api';
import { format } from 'date-fns';

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
  comments: Comment[];
  attachments: Attachment[];
}

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

// Define status options
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
  { value: 'urgent', label: 'Urent' },
];

export default function ITTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userRole } = useRoleCheck();
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch ticket details
  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['it-ticket', params.id],
    queryFn: async () => {
      const response = await api.get(`/tickets/it/${params.id}`);
      return response.data.data;
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch(`/tickets/it/${params.id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-ticket', params.id] });
      toast.success('Ticket status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update ticket status');
    },
  });

  // Update ticket priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const response = await api.patch(`/tickets/it/${params.id}/priority`, { priority });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-ticket', params.id] });
      toast.success('Ticket priority updated successfully');
    },
    onError: () => {
      toast.error('Failed to update ticket priority');
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ message, files }: { message: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append('message', message);
      if (files) {
        files.forEach(file => formData.append('files', file));
      }
      
      const response = await api.post(`/tickets/it/${params.id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-ticket', params.id] });
      setComment('');
      setFiles([]);
      setUploadProgress(0);
      toast.success('Comment added successfully');
    },
    onError: () => {
      toast.error('Failed to add comment');
      setUploadProgress(0);
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  // Handle comment submission
  const handleSubmitComment = () => {
    if (!comment.trim() && files.length === 0) return;
    addCommentMutation.mutate({ message: comment, files });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading ticket. Please try again.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <RoleProtectedRoute requiredRole="it_officer" fallbackPath="/">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
              <p className="text-sm text-muted-foreground">
                Created by {ticket.createdBy.name} on {format(new Date(ticket.createdAt), 'PPp')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={ticket.status}
              onValueChange={(value) => updateStatusMutation.mutate(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ticket.priority}
              onValueChange={(value) => updatePriorityMutation.mutate(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {ticket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">{attachment.filename}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment List */}
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {comment.author.role}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{comment.message}</p>
                    </div>
                  ))}
                </div>

                {/* Comment Form */}
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={(!comment.trim() && files.length === 0) || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                  {uploadProgress > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Status</div>
                    <div className="mt-1 flex items-center gap-2">
                      {ticket.status === 'resolved' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : ticket.status === 'closed' ? (
                        <XCircle className="h-4 w-4 text-gray-500" />
                      ) : null}
                      <span className="font-medium">
                        {statusOptions.find(s => s.value === ticket.status)?.label || ticket.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Priority</div>
                    <div className="mt-1 font-medium">
                      {priorityOptions.find(p => p.value === ticket.priority)?.label || ticket.priority}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="mt-1 font-medium">{ticket.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned To</div>
                    <div className="mt-1 font-medium">
                      {ticket.assignedTo?.name || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="mt-1 font-medium">
                      {format(new Date(ticket.createdAt), 'PPp')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                    <div className="mt-1 font-medium">
                      {format(new Date(ticket.updatedAt), 'PPp')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Comments</div>
                    <div className="mt-1 font-medium">{ticket.comments.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Attachments</div>
                    <div className="mt-1 font-medium">{ticket.attachments.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  );
} 