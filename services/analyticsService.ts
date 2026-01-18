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

export interface SystemHealth {
  name: string;
  type: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE';
  uptime: number;
  activeUsers: number;
  lastCheck: string;
  version: string;
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
 * Get system health for Rent Management System
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

