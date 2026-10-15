import api from '../config/api';

export interface SystemStats {
  totalUsers: number;
  totalTenants: number;
  totalProperties: number;
  openTickets: number;
  resolvedTickets: number;
  totalTickets: number;
  totalEmails: number;
  unreadEmails: number;
  totalDocuments: number;
  activeUsers: number;
  userGrowth: number;
}

export interface ActivityData {
  name: string;
  users: number;
  tickets: number;
}

export interface DeploymentHealth {
  id: string;
  name: string;
  type: 'API' | 'Mobile App' | 'Desktop App' | 'Web App' | 'Website' | 'Database' | 'Cache';
  provider: 'Railway' | 'Vercel' | 'Expo / EAS' | 'Database' | 'Redis' | 'App' | 'Local' | 'Unknown';
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED';
  url: string | null;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
  version?: string;
  processUptimeSeconds?: number;
}

export interface SiteVisitPage {
  path: string;
  label: string;
  visits: number;
}

export interface SiteVisitPlace {
  label: string;
  visits: number;
}

export interface SiteVisitorReport {
  today: number;
  last7Days: number;
  pages: SiteVisitPage[];
  places: SiteVisitPlace[];
}

export interface SystemHealth {
  systems: DeploymentHealth[];
  visitors?: SiteVisitorReport;
  checkedAt: string;
}

/**
 * Get system-wide statistics for Rent Management System
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  const response = await api.get('/admin/stats');
  // Backend returns: { success: true, data: {...} }
  // The api wrapper returns the JSON response directly
  if (response.success && response.data) {
    return response.data;
  }
  // Fallback if structure is different
  return response.data || response;
};

/**
 * Get activity data for charts (last 7 days)
 */
export const getActivityData = async (): Promise<ActivityData[]> => {
  const response = await api.get('/admin/activity');
  // Backend returns: { success: true, data: [...] }
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  // Fallback if structure is different
  return response.data || response || [];
};

/**
 * Get direct deployment health for the Asher suite.
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const response = await api.get('/admin/system-health');
  // Backend returns: { success: true, data: {...} }
  if (response.success && response.data) {
    return response.data;
  }
  // Fallback if structure is different
  return response.data || response;
};

