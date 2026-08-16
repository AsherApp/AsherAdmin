import api from '../config/api';

export type ComplianceOverviewRow = {
  propertyId: string;
  propertyName: string;
  country: string;
  specificationType: string;
  landlordEmail?: string;
  landlordName?: string;
  completenessScore: number;
  complete: boolean;
  missing: string[];
  expiringSoon: string[];
  expired: string[];
  meesBlocked?: boolean;
  unprotectedDeposits?: number;
  statutoryOverdue?: number;
  licensingIncomplete?: boolean;
};

export type ComplianceOverviewResponse = {
  summary: {
    totalProperties: number;
    averageCompleteness: number;
    incompleteProperties: number;
    propertiesWithExpiredCerts: number;
    meesBlockedProperties?: number;
    unprotectedDeposits?: number;
    statutoryOverdue?: number;
    licensingIncomplete?: number;
  };
  properties: ComplianceOverviewRow[];
  generatedAt: string;
};

export async function getComplianceOverview(): Promise<ComplianceOverviewResponse> {
  const response = await api.get('/admin/compliance/overview') as { success: boolean; data: ComplianceOverviewResponse };
  if (response.success && response.data) {
    return response.data;
  }
  return response.data;
}
