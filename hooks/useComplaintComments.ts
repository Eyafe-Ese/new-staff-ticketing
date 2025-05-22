import { useMutation } from '@tanstack/react-query';
import api, { createFileUploadRequest } from '@/utils/api';
import { Comment } from './useComplaints';

interface AddCommentParams {
  complaintId: string;
  message: string;
  files?: File[];
  onUploadProgress?: (progressEvent: any) => void;
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
  const addComment = async ({ complaintId, message, files, onUploadProgress }: AddCommentParams): Promise<AddCommentResponse> => {
    // If there are files to upload, use FormData
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('message', message);
      
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
    const response = await api.post(`/complaints/${complaintId}/comments`, { message });
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