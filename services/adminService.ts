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
    emailSent?: boolean;
    emailError?: string;
  };
}> => {
  const response = await api.post('/admin/invite-landlord', data);
  return response;
};

export const resendLandlordInvite = async (
  userId: string,
  sendEmail = true
): Promise<{
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    invitationLink?: string;
    emailSent?: boolean;
    emailError?: string;
  };
}> => {
  return api.post(`/admin/landlords/${userId}/resend-invite`, { sendEmail });
};

export const cancelLandlordInvite = async (userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  return api.delete(`/admin/landlords/${userId}/invite`);
};

export const setLandlordTempPassword = async (
  userId: string,
  tempPassword: string
): Promise<{
  success: boolean;
  message: string;
  data?: { userId: string; email: string; status: string };
}> => {
  return api.post(`/admin/landlords/${userId}/temp-password`, { tempPassword });
};

