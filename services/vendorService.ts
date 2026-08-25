import api from '../config/api';
import { UserProfile } from '../types';

// Mirrors services/userService.ts's landlord pattern + identityVerificationService.ts,
// for the Vendor app onboarding gate (Part 1 of VENDOR_APP_FLOW_SPEC.md).

export interface VendorDocument {
  id: string;
  type: string;
  url: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  email: string;
  name?: string;
  systemId?: string;
  status?: UserProfile['status'];
  lastActive?: string;
  presence?: 'online' | 'away' | 'offline';
  lastSeenAt?: string | null;
  phone?: string;
  createdAt: string;
  vendorId: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  documents: VendorDocument[];
}

export interface VendorUserProfile extends UserProfile {
  vendorId: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  documents: VendorDocument[];
}

export const mapVendorToProfile = (vendor: Vendor): VendorUserProfile => ({
  id: vendor.id,
  name: vendor.name || vendor.email.split('@')[0],
  email: vendor.email,
  role: 'Vendor',
  systemId: vendor.systemId || '2',
  status: vendor.status || 'Active',
  lastActive: vendor.lastActive || 'Invitation sent',
  presence: vendor.presence,
  lastSeenAt: vendor.lastSeenAt,
  phone: vendor.phone || '',
  ticketsRaised: 0,
  vendorId: vendor.vendorId,
  verificationStatus: vendor.verificationStatus,
  businessName: vendor.businessName,
  businessRegistrationNumber: vendor.businessRegistrationNumber,
  documents: vendor.documents || [],
});

export const getAllVendors = async (
  page: number = 1,
  limit: number = 50,
  search: string = ''
): Promise<{ data: VendorUserProfile[]; total: number; page: number; limit: number }> => {
  const response = await api.get(`/admin/vendors?page=${page}&limit=${limit}&search=${search}`);

  if (response.success && response.data) {
    return {
      data: (Array.isArray(response.data) ? response.data : []).map(mapVendorToProfile),
      total: response.total || response.data?.length || 0,
      page: response.page || page,
      limit: response.limit || limit,
    };
  }

  return { data: [], total: 0, page, limit };
};

// --- Verification review ---

export interface PendingVendorVerification {
  vendorId: string;
  userId: string;
  name: string;
  email: string;
  country?: string | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  documents: VendorDocument[];
  submittedAt: string | null;
  payout?: {
    provider: 'STRIPE' | 'PAYSTACK' | 'NONE';
    status: 'READY' | 'PENDING' | 'NOT_STARTED' | 'N/A';
    detailsSubmitted: boolean;
    payoutsEnabled: boolean;
    requirements: string[];
  };
}

export const getPendingVendorVerifications = async (): Promise<
  PendingVendorVerification[]
> => {
  const response = await api.get('/admin/vendors/verifications/pending');
  return response.data ?? [];
};

export const approveVendorVerification = async (vendorId: string): Promise<void> => {
  await api.post(`/admin/vendors/${vendorId}/verification/approve`);
};

export const rejectVendorVerification = async (
  vendorId: string,
  reason: string
): Promise<void> => {
  await api.post(`/admin/vendors/${vendorId}/verification/reject`, { reason });
};

// --- Document-requirements config ---

export interface VendorDocumentRequirement {
  id: string;
  type: string;
  label: string;
  active: boolean;
  // Scoping: which market and which signup type this requirement targets.
  country?: string | null; // null/empty = all countries
  appliesTo?: 'ALL' | 'INDIVIDUAL' | 'BUSINESS';
  description?: string | null;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDocumentRequirementInput {
  country?: string | null;
  appliesTo?: 'ALL' | 'INDIVIDUAL' | 'BUSINESS';
  description?: string | null;
  sortOrder?: number;
}

export const getVendorDocumentRequirements = async (): Promise<
  VendorDocumentRequirement[]
> => {
  const response = await api.get('/admin/vendors/document-requirements');
  return response.data ?? [];
};

export const createVendorDocumentRequirement = async (
  type: string,
  label: string,
  extras?: VendorDocumentRequirementInput
): Promise<VendorDocumentRequirement> => {
  const response = await api.post('/admin/vendors/document-requirements', {
    type,
    label,
    ...(extras ?? {}),
  });
  return response.data;
};

export const updateVendorDocumentRequirement = async (
  requirementId: string,
  data: { label?: string; active?: boolean } & VendorDocumentRequirementInput
): Promise<VendorDocumentRequirement> => {
  const response = await api.patch(`/admin/vendors/document-requirements/${requirementId}`, data);
  return response.data;
};

export const deleteVendorDocumentRequirement = async (requirementId: string): Promise<void> => {
  await api.delete(`/admin/vendors/document-requirements/${requirementId}`);
};

// --- Profile/business field requirements (Stripe-ready collection) ---

export interface VendorFieldRequirement {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  active: boolean;
  country?: string | null;
  appliesTo?: 'ALL' | 'INDIVIDUAL' | 'BUSINESS';
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorFieldRequirementInput {
  country?: string | null;
  appliesTo?: 'ALL' | 'INDIVIDUAL' | 'BUSINESS';
  description?: string | null;
  sortOrder?: number;
}

export const getVendorFieldRequirements = async (): Promise<VendorFieldRequirement[]> => {
  const response = await api.get('/admin/vendors/field-requirements');
  return response.data ?? [];
};

export const createVendorFieldRequirement = async (
  key: string,
  label: string,
  extras?: VendorFieldRequirementInput
): Promise<VendorFieldRequirement> => {
  const response = await api.post('/admin/vendors/field-requirements', {
    key,
    label,
    ...(extras ?? {}),
  });
  return response.data;
};

export const updateVendorFieldRequirement = async (
  requirementId: string,
  data: { label?: string; active?: boolean } & VendorFieldRequirementInput
): Promise<VendorFieldRequirement> => {
  const response = await api.patch(`/admin/vendors/field-requirements/${requirementId}`, data);
  return response.data;
};

export const deleteVendorFieldRequirement = async (requirementId: string): Promise<void> => {
  await api.delete(`/admin/vendors/field-requirements/${requirementId}`);
};
