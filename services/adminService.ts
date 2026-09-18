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

export const deleteLandlordAccount = async (userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    return await api.delete(`/admin/users/${userId}`);
  } catch (err: any) {
    const status = String(err?.message || err?.status || '');
    if (
      status.includes('404') ||
      status.toLowerCase().includes('not found') ||
      status.toLowerCase().includes('cannot get') ||
      status.toLowerCase().includes('cannot delete')
    ) {
      return api.delete(`/admin/landlords/${userId}`);
    }
    throw err;
  }
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

export type UserPortfolioWallet = {
  currency: string;
  balance: number;
  isActive: boolean;
};

export type UserPortfolioPerson = {
  userId: string;
  landlordId?: string;
  landlordCode?: string | null;
  businessName?: string | null;
  name: string;
  email: string;
};

export type UserPortfolioProperty = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  zipcode?: string | null;
  availability?: string | null;
  specificationType?: string | null;
  currency?: string | null;
  price?: number | null;
  isListed?: boolean | null;
  tenantCount?: number;
  unitCount?: number;
};

export type UserPortfolioTenant = {
  id: string;
  tenantCode?: string | null;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isCurrentLease?: boolean;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  rentstatus?: number | null;
  property?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  unit?: string | null;
  room?: string | null;
  landlord?: UserPortfolioPerson | null;
};

export type UserPortfolio = {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: string[];
    isVerified?: boolean;
    isSuspended?: boolean;
  };
  landlordId?: string | null;
  landlordCode?: string | null;
  businessName?: string | null;
  vendor?: { id: string; businessName?: string | null; verificationStatus?: string } | null;
  wallets: UserPortfolioWallet[];
  properties: UserPortfolioProperty[];
  tenants: UserPortfolioTenant[];
  leases: UserPortfolioTenant[];
  landlord?: UserPortfolioPerson | null;
  counts: {
    properties: number;
    tenants: number;
    leases: number;
    wallets: number;
  };
};

export const getUserPortfolio = async (userId: string): Promise<UserPortfolio> => {
  const response = await api.get(`/admin/users/${userId}/portfolio`);
  return response.data || response;
};

export const setLandlordSuspension = async (
  userId: string,
  suspend: boolean
): Promise<{
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    status: string;
    isSuspended?: boolean;
    suspendedAt?: string | null;
  };
}> => {
  return api.post(`/admin/landlords/${userId}/suspend`, { suspend });
};

