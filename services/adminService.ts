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

export interface DeleteUserResult {
  success: boolean;
  message: string;
  data: {
    userId: string;
    mode: 'hard';
    deletedRecords: number;
    deletedByTable: Record<string, number>;
  };
}

/** One endpoint for landlords, tenants, vendors and web users. */
export const deleteUserAccount = async (userId: string): Promise<DeleteUserResult> => {
  const result = await api.delete(`/admin/users/${encodeURIComponent(userId)}`);
  if (!result.success || result.data?.mode !== 'hard') {
    throw new Error('The account was not fully deleted. Refresh the directory and try again.');
  }
  return result;
};

// Kept for older callers; all account types use the same deletion contract.
export const deleteLandlordAccount = deleteUserAccount;

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


/** A landlord who asked for access from the public website. */
export interface LandlordAccessRequest {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt: string | null;
  reviewNote: string | null;
  invitedUserId: string | null;
  createdAt: string;
}

/** Newest first. Omit `status` for all of them. */
export const getLandlordAccessRequests = async (
  status?: LandlordAccessRequest['status']
): Promise<LandlordAccessRequest[]> => {
  // This client's get() takes a url only, so the filter goes in the query.
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await api.get(`/admin/landlord-access-requests${query}`);
  return response?.data?.data ?? response?.data ?? [];
};

/**
 * Approving sends the ordinary landlord invitation — the same account, email
 * and set-password link an admin-invited landlord has always received.
 */
export const approveLandlordAccessRequest = async (id: string) => {
  const response = await api.post(`/admin/landlord-access-requests/${id}/approve`);
  return response?.data ?? response;
};

export const rejectLandlordAccessRequest = async (id: string, reviewNote?: string) => {
  const response = await api.post(`/admin/landlord-access-requests/${id}/reject`, {
    reviewNote,
  });
  return response?.data ?? response;
};
