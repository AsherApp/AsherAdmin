import api from '../config/api';

export interface PendingIdentityVerification {
  landlordId: string;
  userId: string;
  name: string;
  email: string;
  businessName: string | null;
  documentUrls: string[];
  submittedAt: string | null;
  /** 'stripe' = UK landlord — Stripe Connect KYC clears this automatically; admin is view-only. */
  verifiedVia: 'stripe' | 'admin';
  stripeDetailsSubmitted: boolean;
  stripePayoutsEnabled: boolean;
}

export const getPendingIdentityVerifications = async (): Promise<
  PendingIdentityVerification[]
> => {
  const response = await api.get('/admin/landlords/identity-verifications/pending');
  return response.data ?? [];
};

export const approveLandlordIdentity = async (
  landlordId: string
): Promise<void> => {
  await api.post(`/admin/landlords/${landlordId}/identity-verification/approve`);
};

export const rejectLandlordIdentity = async (
  landlordId: string
): Promise<void> => {
  await api.post(`/admin/landlords/${landlordId}/identity-verification/reject`);
};
