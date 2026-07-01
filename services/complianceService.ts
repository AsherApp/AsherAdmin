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
};

export type ComplianceOverviewResponse = {
  summary: {
    totalProperties: number;
    averageCompleteness: number;
    incompleteProperties: number;
    propertiesWithExpiredCerts: number;
  };
  properties: ComplianceOverviewRow[];
  generatedAt: string;
};

export async function getComplianceOverview(): Promise<ComplianceOverviewResponse> {
  const response = await api.get<{ success: boolean; data: ComplianceOverviewResponse }>(
    '/admin/compliance/overview'
  );
  if (response.success && response.data) {
    return response.data;
  }
  return (response as { data?: ComplianceOverviewResponse }).data ?? (response as ComplianceOverviewResponse);
}
