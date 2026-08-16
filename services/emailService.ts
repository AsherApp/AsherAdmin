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
      fullname?: string;
    };
  };
  receiver?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullname?: string;
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
export const getAllEmails = async (page = 1, limit = 100, search = ''): Promise<{ data: Email[]; total: number }> => {
  const response = await api.get(`/admin/emails?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  return { data: Array.isArray(response.data) ? response.data : [], total: response.total || response.pagination?.totalItems || 0 };
};

/**
 * Get inbox emails (emails received by admin)
 * This endpoint returns emails where the admin is the receiver
 */
export const getInbox = async (page: number = 1, limit: number = 50, search: string = ''): Promise<{ data: Email[]; total: number }> => {
  return getEmailFolder('inbox', page, limit, search);
};

export const getEmailFolder = async (folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred', page = 1, limit = 100, search = ''): Promise<{ data: Email[]; total: number }> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
  let endpoint = '/emails/user-mails/categorize';
  if (folder === 'sent') endpoint = '/emails/user/sent';
  if (folder === 'drafts') params.set('isDraft', 'true');
  if (folder === 'trash') params.set('isThrash', 'true');
  if (folder === 'starred') params.set('isStarred', 'true');
  const response = await api.get(`${endpoint}?${params.toString()}`);
  return { data: Array.isArray(response.data) ? response.data : [], total: response.pagination?.totalItems || response.data?.length || 0 };
};

export const updateEmailState = async (emailId: string, state: { isStarred?: boolean; isArchived?: boolean; isDeleted?: boolean }) => api.patch(`/emails/state/${emailId}`, state);
export const recoverEmail = async (emailId: string) => api.patch(`/emails/recover/${emailId}`);

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
    const response = await api.post('/emails/reply', { originalEmailId: emailId, additionalMessage: body });
    return response.data || response;
  }
};

