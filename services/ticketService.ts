import api from '../config/api';

export interface Ticket {
  id: string;
  ticketCode?: string; // Human-readable ticket code (e.g., LJA-2311251200)
  subject: string;
  description: string;
  type: 'SUPPORT' | 'SUGGESTION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'PENDING';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  raisedById?: string;
  raisedByTenantId?: string;
  assignedToId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  raisedBy?: {
    id: string;
    user?: {
      id: string;
      email: string;
      profile?: {
        firstName?: string;
        lastName?: string;
        fullname?: string;
      };
    };
  };
  raisedByTenant?: {
    id: string;
    tenantWebUserEmail?: string;
    user?: {
      email: string;
      profile?: {
        firstName?: string;
        lastName?: string;
        fullname?: string;
      };
    };
  };
  assignedTo?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullname?: string;
    };
  };
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    sender?: {
      id: string;
      email: string;
      profile?: {
        firstName?: string;
        lastName?: string;
        fullname?: string;
      };
      role?: string[];
    };
    attachments?: string[];
    isInternal?: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  type: 'SUPPORT' | 'SUGGESTION';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'PENDING';
  attachments?: string[];
}

/**
 * Get all tickets (from FE) - Admin endpoint
 * Backend returns: { data: Ticket[], pagination: { totalItems, totalPages, currentPage, itemsPerPage, hasNextPage, hasPreviousPage } }
 */
export const getAllTickets = async (page: number = 1, limit: number = 50, search: string = ''): Promise<{ data: Ticket[]; total: number }> => {
  try {
    console.log('🔄 Fetching tickets:', { page, limit, search });
    // Use admin endpoint instead of landlord endpoint
    const response = await api.get(`/admin/tickets?page=${page}&limit=${limit}&search=${search}`);
    
    // Log full response for debugging
    console.log('📥 Full API response:', JSON.stringify(response, null, 2));
    console.log('📥 Response type:', typeof response);
    console.log('📥 Response keys:', Object.keys(response || {}));
    
    // Admin endpoint returns: { success: true, data: Ticket[], pagination: { totalItems, ... } }
    // api.get() returns response.json() which is the parsed JSON
    let tickets: Ticket[] = [];
    let total = 0;
    
    // Check if response itself is the data object
    if (response && typeof response === 'object') {
      // Admin endpoint structure: { success: true, data: Ticket[], pagination: { totalItems, ... } }
      if (response.success && response.data && Array.isArray(response.data)) {
        tickets = response.data;
        total = response.pagination?.totalItems || response.data.length;
        console.log('✅ Using admin endpoint structure:', { ticketsCount: tickets.length, total });
      }
      // Direct structure: { data: Ticket[], pagination: { totalItems, ... } }
      else if (response.data && Array.isArray(response.data)) {
        tickets = response.data;
        total = response.pagination?.totalItems || response.data.length;
        console.log('✅ Using direct structure:', { ticketsCount: tickets.length, total });
      } 
      // Check if response is an array (unlikely but possible)
      else if (Array.isArray(response)) {
        tickets = response;
        total = response.length;
        console.log('✅ Response is array:', { ticketsCount: tickets.length, total });
      }
      // Wrapped structure: { success: true, data: { data: Ticket[], pagination: {...} } }
      else if (response.success && response.data && response.data.data && Array.isArray(response.data.data)) {
        tickets = response.data.data;
        total = response.data.pagination?.totalItems || response.data.data.length;
        console.log('✅ Using success-wrapped nested:', { ticketsCount: tickets.length, total });
      }
      // Fallback: try to find tickets array anywhere
      else {
        console.warn('⚠️ Unexpected response structure:', response);
        console.warn('⚠️ Attempting fallback parsing...');
        tickets = Array.isArray(response.tickets) ? response.tickets : [];
        total = response.pagination?.totalItems || response.total || response.count || 0;
        console.log('⚠️ Fallback result:', { ticketsCount: tickets.length, total });
      }
    } else {
      console.error('❌ Invalid response type:', typeof response, response);
    }
    
    console.log('📦 Final parsed tickets:', { count: tickets.length, total });
    
    return {
      data: tickets,
      total: total,
    };
  } catch (error: any) {
    console.error('❌ Error fetching tickets:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    return { data: [], total: 0 };
  }
};

/**
 * Get ticket by ID (admin endpoint)
 */
export const getTicketById = async (ticketId: string): Promise<Ticket> => {
  const response = await api.get(`/admin/tickets/${ticketId}`);
  // Admin endpoint returns: { success: true, data: Ticket }
  return response.data || response;
};

/**
 * Update ticket status (admin endpoint)
 */
export const updateTicketStatus = async (ticketId: string, status: string): Promise<Ticket> => {
  const response = await api.patch(`/admin/tickets/${ticketId}/status`, { status });
  // Admin endpoint returns: { success: true, data: Ticket }
  return response.data || response;
};

/**
 * Update ticket (admin endpoint)
 */
export const updateTicket = async (ticketId: string, data: Partial<CreateTicketData>): Promise<Ticket> => {
  const response = await api.patch(`/admin/tickets/${ticketId}`, data);
  // Admin endpoint returns: { success: true, data: Ticket }
  return response.data || response;
};

/**
 * Create a new ticket (admin endpoint - admin can create tickets on behalf of users)
 */
export const createTicket = async (ticketData: CreateTicketData, files?: File[]): Promise<Ticket> => {
  // For now, admin endpoint doesn't support file uploads in the same way
  // If files are needed, we'll need to add file upload support to admin endpoint
  if (files && files.length > 0) {
    console.warn('⚠️ File uploads not yet supported in admin ticket creation endpoint');
    // Fallback: create without files for now
  }
  
  const response = await api.post('/admin/tickets', ticketData);
  // Admin endpoint returns: { success: true, data: Ticket }
  return response.data || response;
};

/**
 * Assign ticket to support user (admin endpoint)
 */
export const assignTicket = async (ticketId: string, supportUserId: string): Promise<Ticket> => {
  const response = await api.post(`/admin/tickets/${ticketId}/assign`, { assignedToId: supportUserId });
  // Admin endpoint returns: { success: true, data: Ticket }
  return response.data || response;
};

/**
 * Add message to ticket (admin endpoint)
 */
export const addMessageToTicket = async (ticketId: string, content: string, attachments: string[] = [], isInternal: boolean = false): Promise<{ message: any; ticket: Ticket }> => {
  const response = await api.post(`/admin/tickets/${ticketId}/messages`, { 
    content, 
    attachments, 
    isInternal 
  });
  // Admin endpoint returns: { success: true, data: message, ticket: updatedTicket }
  return {
    message: response.data || response.message,
    ticket: response.ticket || response.data?.ticket,
  };
};

