import api from '../config/api';

export interface ProviderAccountUsage {
  provider: string;
  storageBytes: number;
  storageLimitBytes: number | null;
  storagePercent: number | null;
  creditsUsed: number | null;
  creditsLimit: number | null;
  creditsRemaining: number | null;
  objectCount: number | null;
  resourceCount: number | null;
  measuredAt: string;
}

export interface LandlordStorageUsage {
  landlordId: string;
  name: string;
  email: string;
  quotaBytes: number;
  freeQuotaBytes: number;
  extraQuotaBytes: number;
  usedBytes: number;
  remainingBytes: number;
  usedPercent: number;
  totalFiles: number;
  isComplete: boolean;
  measuredAt: string;
}

export interface StorageOverview {
  account: ProviderAccountUsage;
  landlords: LandlordStorageUsage[];
}

export const getStorageOverview = async (): Promise<StorageOverview> => {
  const response = await api.get('/admin/storage/overview');
  return response.data?.data ?? response.data ?? response;
};
