import api from '../config/api';

export interface PendingIdentityVerification {
  landlordId: string;
  userId: string;
  name: string;
  email: string;
  businessName: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  documentUrls: string[];
  livenessUrls?: string[];
  faceMatch?: {
    matchScore: number;
    isMatch: boolean;
    reasoning?: string;
    checkedAt?: string;
  } | null;
  documentType?: string | null;
  verificationStatus?: 'PENDING' | 'VERIFIED';
  submittedAt: string | null;
  verifiedAt?: string | null;
  /** 'stripe' = UK — Approve after Stripe READY; 'admin' = non-UK admin path. */
  verifiedVia: 'stripe' | 'admin';
  stripeDetailsSubmitted: boolean;
  stripePayoutsEnabled: boolean;
}

function identityRows(response: { data?: PendingIdentityVerification[] } | PendingIdentityVerification[]) {
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

export const getPendingIdentityVerifications = async (): Promise<
  PendingIdentityVerification[]
> => {
  const response = await api.get('/admin/landlords/identity-verifications/pending');
  return identityRows(response);
};

export const getIdentityVerifications = async (
  status: 'pending' | 'verified'
): Promise<PendingIdentityVerification[]> => {
  const response = await api.get(
    `/admin/landlords/identity-verifications?status=${status}`
  );
  return identityRows(response);
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
