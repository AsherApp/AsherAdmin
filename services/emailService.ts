import api from '../config/api';

export interface Email {
  id: string;
  subject: string;
  body: string;
  senderEmail: string;
  receiverEmail?: string;
  senderId: string;
  receiverId?: string;
  attachment?: string[];
  isReadByReceiver?: boolean;
  isDraft?: boolean;
  isSent?: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  receiver?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface CreateEmailData {
  subject: string;
  body: string;
  receiverEmail?: string;
  receiverId?: string;
  attachment?: string[];
  isDraft?: boolean;
}

/**
 * Get ALL emails in the system (admin view - see everything)
 */
export const getAllEmails = async (page: number = 1, limit: number = 100, search: string = ''): Promise<{ data: Email[]; total: number }> => {
  try {
    console.log('🔄 Fetching emails:', { page, limit, search });
    const response = await api.get(`/admin/emails?page=${page}&limit=${limit}&search=${search}`);
    console.log('✅ Emails response:', response);
    
    // Backend returns: { success: true, data: [...], total: number }
    if (response.success && response.data) {
      return {
        data: Array.isArray(response.data) ? response.data : [],
        total: response.total || 0,
      };
    }
    
    // Fallback
    return {
      data: Array.isArray(response.data) ? response.data : [],
      total: response.total || 0,
    };
  } catch (error: any) {
    console.error('❌ Error fetching emails:', error);
    return { data: [], total: 0 };
  }
};

/**
 * Get inbox emails (emails received by admin)
 * This endpoint returns emails where the admin is the receiver
 */
export const getInbox = async (page: number = 1, limit: number = 50, search: string = ''): Promise<{ data: Email[]; total: number }> => {
  // Use admin endpoint to see ALL emails
  return getAllEmails(page, limit, search);
};

/**
 * Get unread emails
 */
export const getUnreadEmails = async (): Promise<Email[]> => {
  const response = await api.get('/emails/user/unread');
  return response.data || response.emails || [];
};

/**
 * Get email by ID
 */
export const getEmailById = async (emailId: string): Promise<Email> => {
  const response = await api.get(`/emails/${emailId}`);
  return response.data || response;
};

/**
 * Create/send email
 */
export const createEmail = async (emailData: CreateEmailData, files?: File[]): Promise<Email> => {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append('subject', emailData.subject);
    formData.append('body', emailData.body);
    if (emailData.receiverId) {
      formData.append('receiverId', emailData.receiverId);
    } else if (emailData.receiverEmail) {
      formData.append('receiverEmail', emailData.receiverEmail);
    }
    if (emailData.isDraft !== undefined) {
      formData.append('isDraft', String(emailData.isDraft));
    }
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.postFormData('/emails', formData);
    return response.data?.email || response.email || response.data || response;
  } else {
    const response = await api.post('/emails', emailData);
    return response.data?.email || response.email || response.data || response;
  }
};

/**
 * Mark email as read
 */
export const markEmailAsRead = async (emailId: string): Promise<Email> => {
  const response = await api.patch(`/emails/read/${emailId}`);
  return response.data || response;
};

/**
 * Reply to email
 */
export const replyToEmail = async (emailId: string, body: string, files?: File[]): Promise<Email> => {
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append('body', body);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.postFormData(`/emails/reply?emailId=${emailId}`, formData);
    return response.data || response;
  } else {
    const response = await api.post('/emails/reply', { emailId, body });
    return response.data || response;
  }
};

