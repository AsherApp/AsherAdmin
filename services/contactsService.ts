import api from '../config/api';

export interface MessagingContact {
  userId: string;
  name: string;
  email: string;
  mailboxEmail: string;
  profileUrl: string | null;
  relationship: 'landlord' | 'tenant' | 'applicant' | 'enquirer';
  landlordId: string;
}

/**
 * Search messaging contacts (admin can reach any user in the system).
 */
export const getMessagingContacts = async (search = ''): Promise<MessagingContact[]> => {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get(`/contacts${params}`);
    return response.data ?? [];
  } catch (error) {
    console.error('Error fetching messaging contacts:', error);
    return [];
  }
};
