import { useMutation, useQuery } from '@tanstack/react-query';
import api, { createFileUploadRequest } from '@/utils/api';
import { Attachment } from './useComplaints';

// Define author type from API response
export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Updated Comment interface to match the API response
export interface Comment {
  id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  attachments?: Attachment[];
}

// Response type for fetching comments
export interface CommentsResponse {
  data: Comment[];
}

interface AddCommentParams {
  complaintId: string;
  message: string;
  files?: File[];
  onUploadProgress?: (progressEvent: any) => void;
  isInternal?: boolean;
}

interface AddCommentResponse {
  data: Comment;
  timestamp: string;
}

interface DeleteCommentAttachmentParams {
  complaintId: string;
  commentId: string;
  attachmentId: string;
}

/**
 * Hook for adding comments to a complaint with attachment uploads
 * @returns Mutation for adding comments
 */
export function useComplaintComments() {
  const addComment = async ({ complaintId, message, files, onUploadProgress, isInternal = false }: AddCommentParams): Promise<AddCommentResponse> => {
    // If there are files to upload, use FormData
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('isInternal', isInternal.toString());
      
      // Append each file to the FormData using 'files' field name as per API docs
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Use specialized file upload function with timeout and progress tracking
      const response = await createFileUploadRequest(
        `/complaints/${complaintId}/comments`, 
        formData,
        { onUploadProgress }
      );
      
      return response.data;
    } 
    
    // If no files, just send JSON
    const response = await api.post(`/complaints/${complaintId}/comments`, { 
      message,
      isInternal
    });
    return response.data;
  };

  const deleteCommentAttachment = async ({ complaintId, commentId, attachmentId }: DeleteCommentAttachmentParams): Promise<void> => {
    await api.delete(`/complaints/${complaintId}/comments/${commentId}/attachments/${attachmentId}`);
  };

  return {
    addComment: useMutation({
      mutationFn: addComment,
    }),
    deleteCommentAttachment: useMutation({
      mutationFn: deleteCommentAttachment,
    })
  };
}

/**
 * Hook for fetching comments for a specific complaint
 * @param complaintId The ID of the complaint to fetch comments for
 * @returns Comments data and loading state
 */
export function useComplaintCommentsList(complaintId: string) {
  const fetchComments = async (): Promise<Comment[]> => {
    if (!complaintId) {
      return [];
    }
    
    const response = await api.get(`/complaints/${complaintId}/comments`);
    
    // Handle the API response format with data nesting
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    console.warn('Unexpected response format from comments endpoint:', response.data);
    return [];
  };

  return useQuery({
    queryKey: ['complaint-comments', complaintId],
    queryFn: fetchComments,
    enabled: !!complaintId,
    staleTime: 30000, // 30 seconds
  });
} 