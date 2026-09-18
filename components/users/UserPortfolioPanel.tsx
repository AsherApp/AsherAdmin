import React from 'react';
import { Building2, Users, Wallet, MapPin, Home, KeyRound, Loader, AlertCircle } from 'lucide-react';
import type {
  UserPortfolio,
  UserPortfolioProperty,
  UserPortfolioTenant,
} from '../../services/adminService';

const formatMoney = (amount: number | null | undefined, currency?: string | null) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const code = (currency || 'GBP').toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(Number(amount));
  } catch {
    return `${code} ${Number(amount).toFixed(2)}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const availabilityTone = (status?: string | null) => {
  const value = (status || '').toUpperCase();
  if (value === 'OCCUPIED' || value === 'RENTED') return 'bg-amber-100/70 text-amber-800 border-amber-200/60';
  if (value === 'VACANT' || value === 'AVAILABLE') return 'bg-emerald-100/70 text-emerald-800 border-emerald-200/60';
  return 'bg-white/50 text-gray-600 border-white/60';
};

const PropertyCard: React.FC<{ property: UserPortfolioProperty }> = ({ property }) => (
  <div className="p-4 rounded-2xl bg-white/35 border border-white/50 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-bold text-gray-900 text-sm">{property.name}</p>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0" />
          {[property.address, property.city, property.country].filter(Boolean).join(', ') || 'No address'}
        </p>
      </div>
      {property.availability && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${availabilityTone(property.availability)}`}>
          {property.availability}
        </span>
      )}
    </div>
    <div className="flex flex-wrap gap-3 mt-3 text-[11px] font-bold text-gray-600">
      <span>{property.unitCount || 0} units</span>
      <span>{property.tenantCount || 0} tenants</span>
      {property.price != null && <span>{formatMoney(property.price, property.currency)}</span>}
      {property.isListed != null && (
        <span className={property.isListed ? 'text-emerald-700' : 'text-gray-400'}>
          {property.isListed ? 'Listed' : 'Unlisted'}
        </span>
      )}
    </div>
  </div>
);

const TenantRow: React.FC<{ tenant: UserPortfolioTenant; showLandlord?: boolean }> = ({ tenant, showLandlord }) => (
  <div className="p-4 rounded-2xl bg-white/35 border border-white/50 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-bold text-gray-900 text-sm">{tenant.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{tenant.email || 'No email'}</p>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
        tenant.isCurrentLease ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200/60' : 'bg-gray-100/70 text-gray-600 border-gray-200/60'
      }`}>
        {tenant.isCurrentLease ? 'Current lease' : 'Past lease'}
      </span>
    </div>
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
      <p><span className="font-bold text-gray-500">Property</span> {tenant.property?.name || '—'}</p>
      <p><span className="font-bold text-gray-500">Unit / room</span> {[tenant.unit, tenant.room].filter(Boolean).join(' · ') || '—'}</p>
      <p><span className="font-bold text-gray-500">Lease</span> {formatDate(tenant.leaseStartDate)} – {formatDate(tenant.leaseEndDate)}</p>
      {showLandlord && <p><span className="font-bold text-gray-500">Landlord</span> {tenant.landlord?.name || '—'}</p>}
    </div>
  </div>
);

interface UserPortfolioPanelProps {
  portfolio: UserPortfolio | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

const UserPortfolioPanel: React.FC<UserPortfolioPanelProps> = ({ portfolio, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader className="animate-spin text-red-600 mr-2" size={20} />
        <span className="text-sm font-medium">Loading property records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
        <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={onRetry} className="mt-2 text-xs font-bold text-red-700 underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return <p className="text-sm text-gray-500">No property records for this user.</p>;
  }

  const primaryWallet = portfolio.wallets[0];
  const extraWallets = portfolio.wallets.slice(1);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/40 border border-white/50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><Building2 size={12} /> Properties</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{portfolio.counts.properties}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/40 border border-white/50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><Users size={12} /> Tenants</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{portfolio.counts.tenants}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/40 border border-white/50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><KeyRound size={12} /> Leases</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{portfolio.counts.leases}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/40 border border-white/50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><Wallet size={12} /> Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {primaryWallet ? formatMoney(primaryWallet.balance, primaryWallet.currency) : '—'}
          </p>
          {extraWallets.map((wallet) => (
            <p key={wallet.currency} className="text-[11px] font-bold text-gray-500 mt-1">
              {formatMoney(wallet.balance, wallet.currency)}
            </p>
          ))}
        </div>
      </div>

      {portfolio.landlord && (
        <section>
          <h3 className="font-bold text-gray-800 text-lg mb-3">Connected landlord</h3>
          <div className="p-4 rounded-2xl bg-white/35 border border-white/50">
            <p className="font-bold text-gray-900 text-sm">{portfolio.landlord.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{portfolio.landlord.email}</p>
            {portfolio.landlord.businessName && (
              <p className="text-xs text-gray-600 mt-2">{portfolio.landlord.businessName}</p>
            )}
          </div>
        </section>
      )}

      {portfolio.vendor && (
        <section>
          <h3 className="font-bold text-gray-800 text-lg mb-3">Vendor</h3>
          <div className="p-4 rounded-2xl bg-white/35 border border-white/50">
            <p className="font-bold text-gray-900 text-sm">{portfolio.vendor.businessName || 'Vendor account'}</p>
            {portfolio.vendor.verificationStatus && (
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{portfolio.vendor.verificationStatus}</p>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><Home size={18} /> Properties</h3>
        {portfolio.properties.length === 0 ? (
          <p className="text-sm text-gray-500">No properties linked to this account.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {portfolio.properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {(portfolio.tenants.length > 0 || portfolio.leases.length === 0) && (
        <section>
          <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><Users size={18} /> Connected tenants</h3>
          {portfolio.tenants.length === 0 ? (
            <p className="text-sm text-gray-500">No tenants connected to this account.</p>
          ) : (
            <div className="space-y-3">
              {portfolio.tenants.map((tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} />
              ))}
            </div>
          )}
        </section>
      )}

      {portfolio.leases.length > 0 && (
        <section>
          <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><KeyRound size={18} /> This user’s leases</h3>
          <div className="space-y-3">
            {portfolio.leases.map((lease) => (
              <TenantRow key={lease.id} tenant={lease} showLandlord />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default UserPortfolioPanel;
