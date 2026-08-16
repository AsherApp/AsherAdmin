import api from '../config/api';

export type RevenueBreakdownRow = {
  group: string | null;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  count: number;
};

export type RevenueSummary = {
  grossVolume: number;
  commissionRevenue: number;
  feeForServiceRevenue: number;
  totalRevenue: number;
  netPaidOut: number;
  takeRatePercent: number;
  eventCount: number;
  breakdown?: RevenueBreakdownRow[];
};

export type RevenueTimeseriesPoint = {
  date: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
};

export type ReportGroupBy = 'category' | 'property' | 'landlord' | 'vendor' | 'currency' | 'month';

const unwrap = <T>(response: any): T => {
  if (response?.success && response.data) return response.data as T;
  return (response?.data || response) as T;
};

export const getRevenueSummary = async (params: {
  from?: string;
  to?: string;
  currency?: string;
  category?: string;
  groupBy?: ReportGroupBy;
} = {}): Promise<RevenueSummary> => {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.currency) query.set('currency', params.currency);
  if (params.category) query.set('category', params.category);
  if (params.groupBy) query.set('groupBy', params.groupBy);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await api.get(`/admin/reports/summary${suffix}`);
  return unwrap<RevenueSummary>(response);
};

export const getRevenueTimeseries = async (params: {
  from?: string;
  to?: string;
  currency?: string;
  interval?: 'day' | 'week' | 'month';
} = {}): Promise<RevenueTimeseriesPoint[]> => {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.currency) query.set('currency', params.currency);
  if (params.interval) query.set('interval', params.interval);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await api.get(`/admin/reports/timeseries${suffix}`);
  return unwrap<RevenueTimeseriesPoint[]>(response);
};
