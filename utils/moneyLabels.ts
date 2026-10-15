const REFERENCE_LABELS: Record<string, string> = {
  FUND_WALLET: 'Wallet top-up',
  WITHDRAWAL: 'Withdrawal',
  MAKE_PAYMENT: 'Payment sent',
  RECEIVE_PAYMENT: 'Payment received',
  RENT_DUE: 'Rent due',
  RENT_PAYMENT: 'Rent',
  MAINTENANCE_FEE: 'Maintenance',
  LANDLORD_PAYOUT: 'Landlord payout',
  BILL_PAYMENT: 'Bill',
  APPLICATION_FEE: 'Application fee',
  LATE_FEE: 'Late fee',
  CHARGES: 'Asher fee',
  SUPPLIES: 'Supplies',
  EQUIPMENTS: 'Equipment',
  TRANSFER: 'Transfer',
  PAYOUT: 'Payout',
  ADS_PAYMENT: 'Advert',
  LISTING_FEE: 'Listing fee',
  LISTING_PREMIUM: 'Featured listing',
  RELOCATION_POST_FEE: 'Relocate fee',
};

const TYPE_LABELS: Record<string, string> = {
  CREDIT: 'Money in',
  DEBIT: 'Money out',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  RENT_RENEWED: 'Rent renewed',
};

export function moneyLabel(value?: string | null): string {
  if (!value) return '—';
  const plain = value.replace(/_/g, ' ').toLowerCase();
  return REFERENCE_LABELS[value] || TYPE_LABELS[value] || STATUS_LABELS[value] || plain.charAt(0).toUpperCase() + plain.slice(1);
}
