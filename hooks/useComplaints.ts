import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';

export interface Attachment {
  id: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  publicId: string;
  filename: string;
}

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  message: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface CategoryEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface StatusEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
  level?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriorityEntity {
  id: string;
  name: string;
  code: string;
}

export interface Department {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
}

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any; // For other user properties
}

export interface Complaint {
  id: string;
  title?: string;
  subject?: string;
  description: string;
  priority?: string | null;
  status?: string;
  isAnonymous: boolean;
  categoryEntity?: CategoryEntity;
  categoryId: string;
  statusEntity?: StatusEntity;
  statusId?: string;
  priorityEntity?: PriorityEntity | null;
  priorityId?: string | null;
  department?: Department;
  reportedBy?: User;
  assignedTo?: User | null;
  trackingToken?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  comments?: Comment[];
}

export interface ComplaintsResponse {
  data: Complaint[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

interface ComplaintsParams {
  page?: number;
  limit?: number;
  status?: string;
  statusId?: string;
  categoryId?: string;
  priorityId?: string;
  includeAnonymous?: boolean;
  search?: string;
}

/**
 * Fetches complaints from the API with optional filtering
 * @param params Optional parameters for filtering complaints
 * @returns Complaints data and loading state
 */
export function useComplaints(params: ComplaintsParams = {}) {
  const fetchComplaints = async (): Promise<ComplaintsResponse> => {
    // For my-complaints endpoint, remove pagination params as they're not supported
    const apiParams = { ...params };
    
    if (apiParams.page) delete apiParams.page;
    if (apiParams.limit) delete apiParams.limit;
    
    const response = await api.get('/complaints/my-complaints', { params: apiParams });
    
    // Handle response structure with nested data array
    let allComplaints: Complaint[] = [];
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // Data is nested inside a data property (typical API pattern)
      allComplaints = response.data.data;
    } else if (Array.isArray(response.data)) {
      // Data is directly an array
      allComplaints = response.data;
    } else {
      console.warn('Unexpected response format from /complaints/my-complaints:', response.data);
    }
    
    // Client-side pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = allComplaints.length;
    const totalPages = Math.ceil(total / limit) || 1; // Ensure at least 1 page
    
    // Manually paginate the results
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
    const paginatedComplaints = allComplaints.slice(startIndex, endIndex);
    
    return {
      data: paginatedComplaints,
      meta: {
        total,
        page,
        limit,
        totalPages
      },
      timestamp: new Date().toISOString()
    };
  };

  const queryKey = ['complaints', params];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchComplaints,
  });

  return {
    complaints: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError,
    error,
    refetch
  };
} 