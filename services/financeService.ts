import api from '../config/api';

export type WalletBalance = {
  id: string;
  currency: string;
  balance: number;
  isActive: boolean;
};

export type AmountByCurrency = {
  currency: string;
  amount: number;
};

export type RevenueByReference = {
  reference: string;
  currency: string;
  amount: number;
  count: number;
};

export type WalletOverview = {
  adminUserId: string;
  wallets: WalletBalance[];
  lifetimeByCurrency: AmountByCurrency[];
  thisMonthByCurrency: AmountByCurrency[];
  byReference: RevenueByReference[];
};

export type LedgerRow = {
  id: string;
  amount: number;
  currency: string | null;
  type: string;
  reference: string;
  status: string;
  description: string | null;
  referenceId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type PlatformTransactionRow = LedgerRow & {
  user: {
    id: string;
    email: string | null;
    role: string[] | string | null;
    name: string | null;
  };
};

export type Paged<T> = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rows: T[];
};

const unwrap = <T>(response: any): T => {
  if (response?.success && response.data) return response.data as T;
  return (response?.data || response) as T;
};

export const getPlatformWallet = async (): Promise<WalletOverview> => {
  const response = await api.get('/admin/wallet');
  return unwrap<WalletOverview>(response);
};

export const getAdminLedger = async (params: {
  page?: number;
  limit?: number;
  currency?: string;
  reference?: string;
} = {}): Promise<Paged<LedgerRow>> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.currency) query.set('currency', params.currency);
  if (params.reference) query.set('reference', params.reference);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await api.get(`/admin/wallet/ledger${suffix}`);
  return unwrap<Paged<LedgerRow>>(response);
};

export const getPlatformTransactions = async (params: {
  page?: number;
  limit?: number;
  currency?: string;
  reference?: string;
  type?: string;
  status?: string;
  q?: string;
} = {}): Promise<Paged<PlatformTransactionRow>> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.currency) query.set('currency', params.currency);
  if (params.reference) query.set('reference', params.reference);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await api.get(`/admin/transactions${suffix}`);
  return unwrap<Paged<PlatformTransactionRow>>(response);
};
