import { useMutation, useQuery } from "@tanstack/react-query";
import api, { createFileUploadRequest } from "@/utils/api";
import { Attachment } from "./useComplaints";

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
  token: string;
  message: string;
  files?: File[];
  onUploadProgress?: (progressEvent: any) => void;
}

interface AddCommentResponse {
  data: Comment;
  timestamp: string;
}

interface AddAttachmentParams {
  token: string;
  files: File[];
  onUploadProgress?: (progressEvent: any) => void;
}

interface AddAttachmentResponse {
  data: Attachment[];
  timestamp: string;
}

/**
 * Hook for adding comments to an anonymous complaint using tracking token
 * @returns Mutation for adding comments
 */
export function useAnonymousComplaintComments() {
  const addComment = async ({
    token,
    message,
    files,
    onUploadProgress,
  }: AddCommentParams): Promise<AddCommentResponse> => {
    // If there are files to upload, use FormData
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("message", message);

      // Append each file to the FormData using 'files' field name as per API docs
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Use specialized file upload function with timeout and progress tracking
      const response = await createFileUploadRequest(
        `/complaints/tracking/${token}/comments`,
        formData,
        { onUploadProgress }
      );

      return response.data;
    }

    // If no files, just send JSON
    const response = await api.post(`/complaints/tracking/${token}/comments`, {
      message,
    });
    return response.data;
  };

  return {
    addComment: useMutation({
      mutationFn: addComment,
    }),
  };
}

/**
 * Hook for fetching comments for an anonymous complaint using tracking token
 * @param token The tracking token to fetch comments for
 * @returns Comments data and loading state
 */
export function useAnonymousComplaintCommentsList(token: string) {
  const fetchComments = async (): Promise<Comment[]> => {
    if (!token) {
      return [];
    }

    const response = await api.get(`/complaints/tracking/${token}/comments`);

    // Handle the API response format with data nesting
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      return response.data.data;
    }

    console.warn(
      "Unexpected response format from comments endpoint:",
      response.data
    );
    return [];
  };

  return useQuery({
    queryKey: ["anonymous-complaint-comments", token],
    queryFn: fetchComments,
    enabled: !!token,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for adding attachments to an anonymous complaint using tracking token
 * @returns Mutation for adding attachments
 */
export function useAnonymousComplaintAttachments() {
  const addAttachments = async ({
    token,
    files,
    onUploadProgress,
  }: AddAttachmentParams): Promise<AddAttachmentResponse> => {
    const formData = new FormData();

    // Append each file to the FormData using 'file' field name as per API docs
    files.forEach((file) => {
      formData.append("file", file);
    });

    // Use specialized file upload function with timeout and progress tracking
    const response = await createFileUploadRequest(
      `/complaints/tracking/${token}/attachments`,
      formData,
      { onUploadProgress }
    );

    return response.data;
  };

  return {
    addAttachments: useMutation({
      mutationFn: addAttachments,
    }),
  };
}
