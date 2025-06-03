import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { RootState } from "./index";

// Types
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
  type: string;
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
  description?: string;
  level?: number;
  isActive?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

interface ComplaintsState {
  items: Complaint[];
  selectedComplaint: Complaint | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  filters: {
    status: string;
    priority: string;
    category: string;
    assignedTo: string;
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  comments: {
    items: Comment[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
  };
  attachments: {
    items: Attachment[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
  };
}

const initialState: ComplaintsState = {
  items: [],
  selectedComplaint: null,
  status: "idle",
  error: null,
  filters: {
    status: "all",
    priority: "all",
    category: "all",
    assignedTo: "all",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  comments: {
    items: [],
    status: "idle",
    error: null,
  },
  attachments: {
    items: [],
    status: "idle",
    error: null,
  },
};

// Async thunks
export const fetchComplaints = createAsyncThunk(
  "complaints/fetchComplaints",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      category?: string;
      assignedTo?: string;
      search?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const { filters, pagination } = state.complaints;

      // Merge params with current filters
      const queryParams = {
        ...filters,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
      };

      // Remove 'all' values from params
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key as keyof typeof queryParams] === "all") {
          delete queryParams[key as keyof typeof queryParams];
        }
      });

      const response = await api.get("/complaints/my-complaints", {
        params: queryParams,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch complaints"
      );
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  "complaints/fetchComplaintById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/complaints/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch complaint"
      );
    }
  }
);

export const fetchComplaintByToken = createAsyncThunk(
  "complaints/fetchComplaintByToken",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/complaints/tracking/${token}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch complaint"
      );
    }
  }
);

export const addComment = createAsyncThunk(
  "complaints/addComment",
  async (
    {
      complaintId,
      message,
      files,
      isInternal = false,
    }: {
      complaintId: string;
      message: string;
      files?: File[];
      isInternal?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("message", message);
        formData.append("isInternal", isInternal.toString());
        files.forEach((file) => formData.append("files", file));

        const response = await api.post(
          `/complaints/${complaintId}/comments`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return response.data.data;
      }

      const response = await api.post(`/complaints/${complaintId}/comments`, {
        message,
        isInternal,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

export const addAttachments = createAsyncThunk(
  "complaints/addAttachments",
  async (
    {
      complaintId,
      files,
    }: {
      complaintId: string;
      files: File[];
    },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await api.post(
        `/complaints/${complaintId}/attachments/multiple`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add attachments"
      );
    }
  }
);

export const deleteAttachment = createAsyncThunk(
  "complaints/deleteAttachment",
  async (
    {
      complaintId,
      attachmentId,
    }: {
      complaintId: string;
      attachmentId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await api.delete(
        `/complaints/${complaintId}/attachments/${attachmentId}`
      );
      return { complaintId, attachmentId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete attachment"
      );
    }
  }
);

// Slice
const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<ComplaintsState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    setPagination: (
      state,
      action: PayloadAction<Partial<ComplaintsState["pagination"]>>
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearSelectedComplaint: (state) => {
      state.selectedComplaint = null;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.data;
        state.pagination = {
          page: action.payload.meta.page,
          limit: action.payload.meta.limit,
          total: action.payload.meta.total,
          totalPages: action.payload.meta.totalPages,
        };
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // Fetch single complaint
      .addCase(fetchComplaintById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedComplaint = action.payload;
        // Update the complaint in the items list if it exists
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // Fetch complaint by token
      .addCase(fetchComplaintByToken.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchComplaintByToken.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedComplaint = action.payload;
      })
      .addCase(fetchComplaintByToken.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // Add comment
      .addCase(addComment.pending, (state) => {
        state.comments.status = "loading";
        state.comments.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.status = "succeeded";
        state.comments.items.push(action.payload);
        if (state.selectedComplaint) {
          state.selectedComplaint.comments =
            state.selectedComplaint.comments || [];
          state.selectedComplaint.comments.push(action.payload);
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.comments.status = "failed";
        state.comments.error = action.payload as string;
      })

      // Add attachments
      .addCase(addAttachments.pending, (state) => {
        state.attachments.status = "loading";
        state.attachments.error = null;
      })
      .addCase(addAttachments.fulfilled, (state, action) => {
        state.attachments.status = "succeeded";
        state.attachments.items.push(...action.payload);
        if (state.selectedComplaint) {
          state.selectedComplaint.attachments =
            state.selectedComplaint.attachments || [];
          state.selectedComplaint.attachments.push(...action.payload);
        }
      })
      .addCase(addAttachments.rejected, (state, action) => {
        state.attachments.status = "failed";
        state.attachments.error = action.payload as string;
      })

      // Delete attachment
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        const { complaintId, attachmentId } = action.payload;
        // Remove from attachments list
        state.attachments.items = state.attachments.items.filter(
          (item) =>
            !(
              item.id === attachmentId &&
              state.selectedComplaint?.id === complaintId
            )
        );
        // Remove from selected complaint if it exists
        if (state.selectedComplaint?.id === complaintId) {
          state.selectedComplaint.attachments =
            state.selectedComplaint.attachments?.filter(
              (item) => item.id !== attachmentId
            );
        }
      });
  },
});

// Actions
export const {
  setFilters,
  setPagination,
  clearSelectedComplaint,
  clearFilters,
} = complaintsSlice.actions;

// Selectors
export const selectComplaints = (state: RootState) => state.complaints.items;
export const selectSelectedComplaint = (state: RootState) =>
  state.complaints.selectedComplaint;
export const selectComplaintsStatus = (state: RootState) =>
  state.complaints.status;
export const selectComplaintsError = (state: RootState) =>
  state.complaints.error;
export const selectComplaintsFilters = (state: RootState) =>
  state.complaints.filters;
export const selectComplaintsPagination = (state: RootState) =>
  state.complaints.pagination;
export const selectComplaintsComments = (state: RootState) =>
  state.complaints.comments;
export const selectComplaintsAttachments = (state: RootState) =>
  state.complaints.attachments;

export default complaintsSlice.reducer;
