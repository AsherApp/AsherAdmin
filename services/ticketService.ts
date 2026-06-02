import api from '../config/api';
import { Ticket as UiTicket, TicketPriority, TicketStatus } from '../types';

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
  raisedByUserId?: string;
  raisedById?: string;
  raisedByTenantId?: string;
}

/** Map backend ticket payload to admin UI ticket shape */
export const mapApiTicketToUiTicket = (
  t: Ticket,
  sourceSystemId = '4'
): UiTicket => {
  const userName =
    t.raisedBy?.user?.profile?.fullname ||
    (t.raisedBy?.user?.profile?.firstName && t.raisedBy?.user?.profile?.lastName
      ? `${t.raisedBy.user.profile.firstName} ${t.raisedBy.user.profile.lastName}`.trim()
      : t.raisedBy?.user?.profile?.firstName) ||
    t.raisedByTenant?.user?.profile?.fullname ||
    (t.raisedByTenant?.user?.profile?.firstName &&
    t.raisedByTenant?.user?.profile?.lastName
      ? `${t.raisedByTenant.user.profile.firstName} ${t.raisedByTenant.user.profile.lastName}`.trim()
      : t.raisedByTenant?.user?.profile?.firstName) ||
    t.raisedByTenant?.tenantWebUserEmail ||
    t.raisedBy?.user?.email ||
    'Unknown';

  const mappedMessages = (t.messages || []).map((msg) => {
    const isStaff =
      msg.sender?.role?.includes('ADMIN') ||
      msg.sender?.role?.includes('LANDLORD');
    return {
      id: msg.id,
      sender: (isStaff ? 'Support' : 'User') as UiTicket['messages'][number]['sender'],
      text: msg.content,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });

  const statusValues = Object.values(TicketStatus);
  const priorityValues = Object.values(TicketPriority);

  return {
    id: t.id,
    ticketCode: t.ticketCode || t.id,
    sourceSystemId,
    subject: t.subject,
    description: t.description,
    user: userName,
    userId: t.raisedById || t.raisedByTenantId || '',
    status: statusValues.includes(t.status as TicketStatus)
      ? (t.status as TicketStatus)
      : TicketStatus.OPEN,
    priority: priorityValues.includes(t.priority as TicketPriority)
      ? (t.priority as TicketPriority)
      : TicketPriority.MEDIUM,
    createdAt: t.createdAt,
    messages: mappedMessages,
  };
};

const parseTicketListResponse = (
  response: Record<string, unknown>
): { data: Ticket[]; total: number } => {
  if (
    response.success &&
    Array.isArray(response.data)
  ) {
    const pagination = response.pagination as { totalItems?: number } | undefined;
    return {
      data: response.data as Ticket[],
      total: pagination?.totalItems ?? response.data.length,
    };
  }

  if (Array.isArray(response.data)) {
    const pagination = response.pagination as { totalItems?: number } | undefined;
    return {
      data: response.data as Ticket[],
      total: pagination?.totalItems ?? response.data.length,
    };
  }

  return { data: [], total: 0 };
};

/**
 * Get all tickets (from FE) - Admin endpoint
 * Backend returns: { data: Ticket[], pagination: { totalItems, totalPages, currentPage, itemsPerPage, hasNextPage, hasPreviousPage } }
 */
export const getAllTickets = async (page: number = 1, limit: number = 50, search: string = ''): Promise<{ data: Ticket[]; total: number }> => {
  try {
    const response = await api.get(
      `/admin/tickets?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    );
    return parseTicketListResponse(response as Record<string, unknown>);
  } catch (error: unknown) {
    console.error('Error fetching tickets:', error);
    return { data: [], total: 0 };
  }
};

/**
 * Get tickets for a specific landlord user (admin user detail view)
 */
export const getTicketsByUserId = async (
  userId: string,
  page: number = 1,
  limit: number = 100,
  search: string = ''
): Promise<{ data: Ticket[]; total: number }> => {
  try {
    const response = await api.get(
      `/admin/users/${userId}/tickets?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    );
    return parseTicketListResponse(response as Record<string, unknown>);
  } catch (error: unknown) {
    console.error('Error fetching user tickets:', error);
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
  if (files && files.length > 0) {
    console.warn('File uploads not yet supported in admin ticket creation endpoint');
  }

  const response = await api.post('/admin/tickets', ticketData);
  const payload = (response as { data?: Ticket }).data ?? response;
  return payload as Ticket;
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

