import api from '../config/api';

export type ListingMonetizationConfig = {
  freePerMonth: number;
  premiumDays: number;
  relocatePostFeeEnabled?: boolean;
  fees: {
    GBP: { listFee: number; premiumFee: number; relocatePostFee: number };
    NGN: { listFee: number; premiumFee: number; relocatePostFee: number };
    USD: { listFee: number; premiumFee: number; relocatePostFee: number };
    EUR: { listFee: number; premiumFee: number; relocatePostFee: number };
  };
  updatedAt?: string;
  updatedById?: string | null;
};

export type ListingMonetizationUpdate = {
  freePerMonth?: number;
  premiumDays?: number;
  listFeeGbp?: number;
  premiumFeeGbp?: number;
  listFeeNgn?: number;
  premiumFeeNgn?: number;
  listFeeUsd?: number;
  premiumFeeUsd?: number;
  listFeeEur?: number;
  premiumFeeEur?: number;
  relocatePostFeeGbp?: number;
  relocatePostFeeNgn?: number;
  relocatePostFeeUsd?: number;
  relocatePostFeeEur?: number;
  relocatePostFeeEnabled?: boolean;
};

export const getListingMonetizationConfig =
  async (): Promise<ListingMonetizationConfig> => {
    const response = await api.get('/admin/system-config/listing-monetization');
    return response.data?.data ?? response.data;
  };

export const updateListingMonetizationConfig = async (
  payload: ListingMonetizationUpdate
): Promise<ListingMonetizationConfig> => {
  const response = await api.put(
    '/admin/system-config/listing-monetization',
    payload
  );
  return response.data?.data ?? response.data;
};
