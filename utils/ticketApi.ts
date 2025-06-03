import api from "./api";
import { toast } from "sonner";

// Types
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  statusId: string;
  priority: string;
  category: string;
  department: string;
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
    id: string;
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
  departmentEntity?: {
    name: string;
  };
}

export interface TicketFilters {
  status?: string;
  category?: string;
  department?: string;
  priority?: string;
  search?: string;
  assignedToMe?: boolean;
  anonymous?: boolean;
  page?: number;
  limit?: number;
}

export interface TicketResponse {
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// API Functions
export const getTickets = async (filters: TicketFilters = {}): Promise<TicketResponse> => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/complaints${params.toString() ? `?${params.toString()}` : ""}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tickets:", error);
    toast.error("Failed to fetch tickets");
    throw error;
  }
};

export const updateTicketStatus = async (ticketId: string, statusId: string): Promise<Ticket> => {
  try {
    const response = await api.patch(`/complaints/${ticketId}`, { statusId });
    toast.success("Ticket status updated");
    return response.data;
  } catch (error) {
    console.error("Error updating ticket status:", error);
    toast.error("Failed to update ticket status");
    throw error;
  }
};

export const assignTicketToMe = async (ticketId: string): Promise<Ticket> => {
  try {
    // Get current user ID from the auth state
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    const response = await api.patch(`/complaints/${ticketId}`, {
      assignedToId: currentUser.id
    });
    toast.success("Ticket assigned to you");
    return response.data;
  } catch (error) {
    console.error("Error assigning ticket:", error);
    toast.error("Failed to assign ticket");
    throw error;
  }
};

export const reassignTicket = async (ticketId: string, userId: string): Promise<Ticket> => {
  try {
    const response = await api.patch(`/complaints/${ticketId}`, {
      assignedToId: userId
    });
    toast.success("Ticket reassigned");
    return response.data;
  } catch (error) {
    console.error("Error reassigning ticket:", error);
    toast.error("Failed to reassign ticket");
    throw error;
  }
};

export const forceCloseTicket = async (ticketId: string, reason: string): Promise<Ticket> => {
  try {
    const response = await api.post(`/complaints/${ticketId}/close`, { reason });
    toast.success("Ticket closed");
    return response.data;
  } catch (error) {
    console.error("Error closing ticket:", error);
    toast.error("Failed to close ticket");
    throw error;
  }
};

export const addTicketComment = async (ticketId: string, comment: string): Promise<void> => {
  try {
    await api.post(`/complaints/${ticketId}/comments`, { comment });
    toast.success("Comment added");
  } catch (error) {
    console.error("Error adding comment:", error);
    toast.error("Failed to add comment");
    throw error;
  }
}; 