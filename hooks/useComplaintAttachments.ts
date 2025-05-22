import { useMutation } from '@tanstack/react-query';
import api, { createFileUploadRequest } from '@/utils/api';
import { Attachment } from './useComplaints';

interface AddAttachmentsParams {
  complaintId: string;
  files: File[];
  onUploadProgress?: (progressEvent: any) => void;
}

interface DeleteAttachmentParams {
  complaintId: string;
  attachmentId: string;
}

interface AttachmentResponse {
  data: Attachment[];
  timestamp: string;
}

/**
 * Hook for adding attachments directly to a complaint
 * @returns Mutation for adding attachments
 */
export function useComplaintAttachments() {
  const addAttachments = async ({ complaintId, files, onUploadProgress }: AddAttachmentsParams): Promise<AttachmentResponse> => {
    const formData = new FormData();
    
    // Append each file to the FormData using the 'files' field name as per API docs
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Use specialized file upload function with timeout and progress tracking
    // Use the /multiple endpoint for multiple file uploads
    const response = await createFileUploadRequest(
      `/complaints/${complaintId}/attachments/multiple`, 
      formData,
      { onUploadProgress }
    );
    
    return response.data;
  };

  const deleteAttachment = async ({ complaintId, attachmentId }: DeleteAttachmentParams): Promise<void> => {
    await api.delete(`/complaints/${complaintId}/attachments/${attachmentId}`);
  };

  return {
    addAttachments: useMutation({
      mutationFn: addAttachments,
    }),
    deleteAttachment: useMutation({
      mutationFn: deleteAttachment,
    })
  };
} 