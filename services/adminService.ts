import api from '../config/api';

/**
 * Invite landlord - Creates user and sends invitation email
 */
export const inviteLandlord = async (data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    invitationLink?: string;
  };
}> => {
  const response = await api.post('/admin/invite-landlord', data);
  return response;
};

