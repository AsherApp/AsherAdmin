import api from '../config/api';

/**
 * Marketplace moderation. Every tenant listing is PENDING until an admin
 * approves it — `GET /api/ads/listed` only ever returns APPROVED, so this
 * queue is the gate between a seller posting and buyers seeing it.
 */
export type ModeratedAd = {
  id: string;
  title: string;
  description: string;
  attachment?: string[];
  /** ITEM = selling something (free to list). BUSINESS = a paid service ad. */
  listingType?: 'ITEM' | 'BUSINESS';
  price?: string | number | null;
  currency?: string | null;
  category?: string | null;
  condition?: string | null;
  locations?: string[];
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt?: string;
  user?: { id?: string; email?: string; profile?: { fullname?: string } };
};

export type ModerationPage = { items: ModeratedAd[]; total: number };

export const getAdsForModeration = async (
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING'
): Promise<ModerationPage> => {
  const response = await api.get(
    `/admin/ads/moderation?status=${encodeURIComponent(status)}`
  );
  const payload = response?.data ?? response;
  return { items: payload?.items ?? [], total: payload?.total ?? 0 };
};

export const reviewAd = async (
  adId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason?: string
) => {
  const response = await api.patch(`/admin/ads/${adId}/review`, { decision, reason });
  return response?.data ?? response;
};
