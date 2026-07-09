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
  businessName: string | null;
  businessRegistrationNumber: string | null;
  documents: VendorDocument[];
  submittedAt: string | null;
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

export const rejectVendorVerification = async (vendorId: string): Promise<void> => {
  await api.post(`/admin/vendors/${vendorId}/verification/reject`);
};

// --- Document-requirements config ---

export interface VendorDocumentRequirement {
  id: string;
  type: string;
  label: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getVendorDocumentRequirements = async (): Promise<
  VendorDocumentRequirement[]
> => {
  const response = await api.get('/admin/vendors/document-requirements');
  return response.data ?? [];
};

export const createVendorDocumentRequirement = async (
  type: string,
  label: string
): Promise<VendorDocumentRequirement> => {
  const response = await api.post('/admin/vendors/document-requirements', { type, label });
  return response.data;
};

export const updateVendorDocumentRequirement = async (
  requirementId: string,
  data: { label?: string; active?: boolean }
): Promise<VendorDocumentRequirement> => {
  const response = await api.patch(`/admin/vendors/document-requirements/${requirementId}`, data);
  return response.data;
};

export const deleteVendorDocumentRequirement = async (requirementId: string): Promise<void> => {
  await api.delete(`/admin/vendors/document-requirements/${requirementId}`);
};
