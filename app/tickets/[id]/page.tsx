"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useParams } from "next/navigation";
import {
  Upload,
  X,
  Loader2,
  RefreshCw,
  Download,
  Plus,
  FileText,
  File,
  Image as ImageIcon,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useComplaint } from "@/hooks/useComplaint";
import {
  useComplaintComments,
  useComplaintCommentsList,
} from "@/hooks/useComplaintComments";
import { useComplaintAttachments } from "@/hooks/useComplaintAttachments";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { format } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { useComplaintStatuses } from "@/hooks/useComplaintStatuses";

// Helper function to format dates consistently
const formatDate = (date: string | Date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy h:mm a");
};

// Card header component with consistent styling
const StyledCardHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <CardHeader
    className={`${
      action ? "flex flex-row items-center justify-between" : ""
    } pb-2 sm:pb-4`}
  >
    <CardTitle>{title}</CardTitle>
    {action}
  </CardHeader>
);

// Types
type StatusCode = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'PENDING' | 'REJECTED';
type PriorityCode = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  isActive: boolean;
}

// Add Priority interface
interface ComplaintPriority {
  id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  isActive: boolean;
}

// Status and Priority helpers
const getStatusColor = (statusCode: StatusCode | undefined | null) => {
  if (!statusCode) return 'bg-gray-100 text-gray-700 border-gray-200';
  
  switch (statusCode) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'RESOLVED':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'PENDING':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getPriorityColor = (priorityCode: PriorityCode | undefined | null) => {
  if (!priorityCode) return 'bg-gray-100 text-gray-700 border-gray-200';
  
  switch (priorityCode) {
    case 'URGENT':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'LOW':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// API functions
const getUsersByRole = async (role: string): Promise<User[]> => {
  const response = await api.get(`/users/by-role/${role}`);
  // Ensure we return an array, even if the API returns a different structure
  return Array.isArray(response.data) ? response.data : 
         Array.isArray(response.data.users) ? response.data.users : 
         Array.isArray(response.data.data) ? response.data.data : [];
};

const updateTicketStatus = async (ticketId: string, statusId: string) => {
  const response = await api.patch(`/complaints/${ticketId}`, { statusId });
  return response.data;
};

const updateTicketPriority = async (ticketId: string, priorityId: string) => {
  const response = await api.patch(`/complaints/${ticketId}`, { priorityId });
  return response.data;
};

const reassignTicket = async (ticketId: string, assignedToId: string) => {
  const response = await api.patch(`/complaints/${ticketId}`, { assignedToId });
  return response.data;
};

// Update the priorities hook
const useComplaintPriorities = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['complaintPriorities', 'active'],
    queryFn: async (): Promise<ComplaintPriority[]> => {
      const response = await api.get('/complaint-priorities/active');
      if (Array.isArray(response.data)) {
        // Sort priorities by level (higher level = higher priority)
        return response.data.sort((a: ComplaintPriority, b: ComplaintPriority) => b.level - a.level);
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.sort((a: ComplaintPriority, b: ComplaintPriority) => b.level - a.level);
      }
      console.warn('Unexpected response format from /complaint-priorities/active:', response.data);
      return [];
    },
  });

  return {
    priorities: Array.isArray(data) ? data : [],
    isLoading,
    isError,
    error
  };
};

export default function TicketManagementPage() {
  // State
  const [comment, setComment] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [complaintFiles, setComplaintFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Refs
  const complaintFileInputRef = useRef<HTMLInputElement>(null);

  // Router and params
  const params = useParams();
  const ticketId = params.id as string;
  const router = useRouter();

  // Role check
  const { hasRole, userRole } = useRoleCheck();

  // Query client
  const queryClient = useQueryClient();

  // Data fetching
  const { complaint, isLoading, refetch } = useComplaint(ticketId);
  const {
    data: comments = [],
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useComplaintCommentsList(ticketId);

  // Fetch users by role
  const { data: availableUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', userRole],
    queryFn: () => getUsersByRole(userRole === 'it_officer' ? 'it_officer' : 'hr_admin'),
    enabled: !!userRole && (userRole === 'it_officer' || userRole === 'hr_admin'),
    retry: 2,
    // Use the correct error handling approach for React Query v5
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 60 * 1000, // 1 minute
  });

  // Add error handling using useEffect
  useEffect(() => {
    if (availableUsers === undefined && !isLoadingUsers) {
      toast.error('Failed to load available users');
    }
  }, [availableUsers, isLoadingUsers]);

  // Mutations
  const {
    addComment: { mutateAsync: addComment, isPending: isAddingComment },
  } = useComplaintComments();

  const {
    addAttachments: {
      mutateAsync: addAttachments,
      isPending: isAddingAttachments,
    },
    deleteAttachment: {
      mutateAsync: deleteAttachment,
      isPending: isDeletingAttachment,
    },
  } = useComplaintAttachments();

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, statusId }: { ticketId: string; statusId: string }) =>
      updateTicketStatus(ticketId, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', ticketId] });
      toast.success('Ticket status updated');
    },
  });

  const priorityMutation = useMutation({
    mutationFn: ({ ticketId, priorityId }: { ticketId: string; priorityId: string }) =>
      updateTicketPriority(ticketId, priorityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', ticketId] });
      toast.success('Ticket priority updated');
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ ticketId, assignedToId }: { ticketId: string; assignedToId: string }) =>
      reassignTicket(ticketId, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', ticketId] });
      toast.success('Ticket reassigned successfully');
      setIsReassigning(false);
    },
  });

  // Add a query to get the current user's info
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      setCurrentUserId(response.data.id);
      return response.data;
    },
  });

  // Add hooks for statuses and priorities
  const { complaintStatuses, isLoading: isLoadingStatuses } = useComplaintStatuses();
  const { priorities, isLoading: isLoadingPriorities } = useComplaintPriorities();

  // Role-based access control
  if (!hasRole('it_officer') && !hasRole('hr_admin')) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Loading ticket details...
        </span>
      </div>
    );
  }

  // Error state
  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load ticket details. The ticket may not exist or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  // Check if user has permission to manage this ticket
  const canManageTicket = 
    (hasRole('it_officer') && complaint.categoryEntity?.type === 'it') ||
    (hasRole('hr_admin') && complaint.categoryEntity?.type === 'hr');

  if (!canManageTicket) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage this ticket. You can only manage tickets from your category.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  // Main UI
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 px-4 sm:px-6 lg:px-0">
      {/* Breadcrumb and Title */}
      <div>
        <nav className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
          <Link href="/tickets" className="hover:underline">
            Tickets
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">
            Ticket #{complaint.id}
          </span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          Manage Ticket #{complaint.id}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8">
        {/* LEFT: Main Ticket Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-lg sm:text-xl font-bold mb-1 truncate max-w-[600px]">
                    {complaint.title || complaint.subject}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Select
                      defaultValue={complaint.statusId || ''}
                      onValueChange={(statusId) => {
                        if (statusId) {
                          statusMutation.mutate({ ticketId: complaint.id, statusId });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingStatuses ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : complaintStatuses.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No statuses available
                          </div>
                        ) : (
                          complaintStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <Select
                      defaultValue={complaint.priorityId || ''}
                      onValueChange={(priorityId) => {
                        if (priorityId) {
                          priorityMutation.mutate({ ticketId: complaint.id, priorityId });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPriorities ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : priorities.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No priorities available
                          </div>
                        ) : (
                          priorities.map((priority) => (
                            <SelectItem 
                              key={priority.id} 
                              value={priority.id}
                              className="flex flex-col items-start"
                            >
                              <div className="font-medium">{priority.name}</div>
                              {priority.description && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {priority.description}
                                </div>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReassigning(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Reassign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <StyledCardHeader title="Description" />
              <CardContent>
                <div className="whitespace-pre-line text-sm">
                  {complaint.description}
                </div>
              </CardContent>
            </Card>

            <Card>
              <StyledCardHeader
                title="Attachments"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => complaintFileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                }
              />
              <CardContent>
                {/* File input */}
                <input
                  ref={complaintFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setComplaintFiles(files);
                    }
                  }}
                  multiple
                  accept=".jpg,.jpeg,.png,.mp4,.pdf"
                />

                {/* Attachments list */}
                {complaint.attachments && complaint.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {complaint.attachments.map((attachment, idx) => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{idx + 1}.</span>
                          <button
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                            onClick={() => {
                              setCurrentAttachmentIndex(idx);
                              setModalOpen(true);
                            }}
                          >
                            {attachment.filename.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : attachment.filename.match(/\.(pdf)$/i) ? (
                              <FileText className="h-4 w-4" />
                            ) : (
                              <File className="h-4 w-4" />
                            )}
                            <span className="truncate max-w-[200px]">
                              {attachment.filename}
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={attachment.url}
                            download={attachment.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteAttachment({
                                complaintId: complaint.id,
                                attachmentId: attachment.id,
                              });
                            }}
                            disabled={isDeletingAttachment}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No attachments
                  </div>
                )}

                {/* Selected files to upload */}
                {complaintFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Files to upload:</div>
                    <ul className="space-y-2">
                      {complaintFiles.map((file, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <span className="text-sm truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setComplaintFiles(files => files.filter((_, i) => i !== idx));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={async () => {
                          try {
                            setIsUploading(true);
                            await addAttachments({
                              complaintId: complaint.id,
                              files: complaintFiles,
                              onUploadProgress: (progressEvent) => {
                                setUploadProgress(
                                  Math.round((progressEvent.loaded * 100) / progressEvent.total)
                                );
                              },
                            });
                            setComplaintFiles([]);
                            toast.success('Files uploaded successfully');
                          } catch (error) {
                            toast.error('Failed to upload files');
                          } finally {
                            setIsUploading(false);
                            setUploadProgress(0);
                          }
                        }}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Files
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setComplaintFiles([])}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <Card>
            <StyledCardHeader title="Comments" />
            <CardContent>
              <div className="space-y-4">
                {/* Comments list */}
                {isLoadingComments ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No comments yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-line">
                            {comment.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment form */}
                <div className="mt-6">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-2"
                    disabled={isAddingComment}
                  />
                  <Button
                    onClick={async () => {
                      if (!comment.trim()) return;
                      try {
                        await addComment({
                          complaintId: complaint.id,
                          message: comment.trim(),
                          isInternal: true,
                        });
                        setComment('');
                        refetchComments();
                        toast.success('Comment added');
                      } catch (error) {
                        toast.error('Failed to add comment');
                      }
                    }}
                    disabled={!comment.trim() || isAddingComment}
                  >
                    {isAddingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Comment'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Ticket Information */}
        <div className="space-y-6">
          <Card>
            <StyledCardHeader title="Ticket Information" />
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        getStatusColor(complaint.statusEntity?.code as StatusCode)
                      }`}
                    >
                      {complaint.statusEntity?.name || complaint.status}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Priority</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        getPriorityColor(complaint.priorityEntity?.code as PriorityCode)
                      }`}
                    >
                      {complaint.priorityEntity?.name || complaint.priority}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd className="mt-1 text-sm">
                    {complaint.categoryEntity?.type
                      ? complaint.categoryEntity.type.toUpperCase()
                      : 'N/A'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Department</dt>
                  <dd className="mt-1 text-sm">
                    {complaint.department?.name || 'N/A'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Assigned To</dt>
                  <dd className="mt-1 text-sm">
                    {complaint.assignedTo?.name || 'Unassigned'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Created By</dt>
                  <dd className="mt-1 text-sm">
                    {complaint.isAnonymous
                      ? 'Anonymous'
                      : complaint.reportedBy?.name || 'Unknown'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(complaint.createdAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">Last Updated</dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(complaint.updatedAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reassign Dialog */}
      <Dialog open={isReassigning} onOpenChange={setIsReassigning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Ticket</DialogTitle>
            <DialogDescription>
              Select a user to reassign this ticket to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Select User</Label>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : !Array.isArray(availableUsers) || availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No users available
                    </div>
                  ) : (
                    availableUsers
                      .filter(user => user.id !== currentUserId) // Filter out current user
                      .map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id}
                          disabled={user.id === complaint.assignedTo?.id} // Disable if already assigned to this user
                        >
                          {user.name} ({user.email})
                          {user.id === complaint.assignedTo?.id && ' (Currently Assigned)'}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUser('');
                setIsReassigning(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  reassignMutation.mutate({
                    ticketId: complaint.id,
                    assignedToId: selectedUser,
                  });
                }
              }}
              disabled={!selectedUser || reassignMutation.isPending}
            >
              {reassignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                'Reassign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 