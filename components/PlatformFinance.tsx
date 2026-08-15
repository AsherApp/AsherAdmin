import React, { useCallback, useEffect, useState } from 'react';
import { Loader, Search, Wallet } from 'lucide-react';
import {
  getAdminLedger,
  getPlatformTransactions,
  getPlatformWallet,
  LedgerRow,
  PlatformTransactionRow,
  WalletOverview,
} from '../services/financeService';

const money = (amount: number, currency?: string | null) => {
  const code = (currency || 'GBP').toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
};

const Field = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    {children ? (
      children
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
      />
    )}
  </label>
);

const PlatformFinance: React.FC = () => {
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [rows, setRows] = useState<PlatformTransactionRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [currency, setCurrency] = useState('');
  const [reference, setReference] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [wallet, adminLedger, platform] = await Promise.all([
        getPlatformWallet(),
        getAdminLedger({ limit: 8 }),
        getPlatformTransactions({
          page,
          limit: 25,
          q: q || undefined,
          currency: currency || undefined,
          reference: reference || undefined,
          type: type || undefined,
        }),
      ]);
      setOverview(wallet);
      setLedger(adminLedger.rows || []);
      setRows(platform.rows || []);
      setTotalPages(platform.totalPages || 1);
      setTotal(platform.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load platform finance');
    } finally {
      setLoading(false);
    }
  }, [page, q, currency, reference, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-gray-800">
          <Wallet className="text-red-600" />
          Platform finance
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-600">
          Admin wallet balances and every transaction moving through Asher.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !overview ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="animate-spin" size={18} />
          Loading finance…
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(overview?.wallets || []).map((wallet) => (
              <div
                key={wallet.currency}
                className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl shadow-red-500/5 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {wallet.currency} wallet
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-800">
                  {money(wallet.balance, wallet.currency)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  This month{' '}
                  {money(
                    overview?.thisMonthByCurrency?.find((row) => row.currency === wallet.currency)
                      ?.amount || 0,
                    wallet.currency
                  )}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800">Revenue by type</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="pb-2">Reference</th>
                    <th className="pb-2">Currency</th>
                    <th className="pb-2">Count</th>
                    <th className="pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview?.byReference || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-gray-500">
                        No Admin credits yet.
                      </td>
                    </tr>
                  ) : (
                    overview?.byReference.map((row) => (
                      <tr key={`${row.reference}-${row.currency}`} className="border-t border-gray-100">
                        <td className="py-2 font-medium text-gray-800">{row.reference}</td>
                        <td className="py-2 text-gray-600">{row.currency}</td>
                        <td className="py-2 text-gray-600">{row.count}</td>
                        <td className="py-2 font-semibold text-gray-800">
                          {money(row.amount, row.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800">Latest Admin credits</h3>
            <div className="mt-4 space-y-2">
              {ledger.length === 0 ? (
                <p className="text-sm text-gray-500">No wallet credits yet.</p>
              ) : (
                ledger.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{row.description || row.reference}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(row.createdAt).toLocaleString()} · {row.reference}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-700">
                      +{money(row.amount, row.currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-red-500/5 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">All platform transactions</h3>
                <p className="text-sm text-gray-500">{total} records</p>
              </div>
              <button
                onClick={() => void load()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="relative xl:col-span-2">
                <Search className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                <Field label="Search" value={q} onChange={setQ}>
                  <input
                    value={q}
                    onChange={(e) => {
                      setPage(1);
                      setQ(e.target.value);
                    }}
                    placeholder="Email, description, reference id"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </Field>
              </label>
              <Field label="Currency" value={currency} onChange={(v) => { setPage(1); setCurrency(v); }}>
                <select
                  value={currency}
                  onChange={(e) => {
                    setPage(1);
                    setCurrency(e.target.value);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-red-400"
                >
                  <option value="">All</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>
              <Field label="Type" value={type} onChange={(v) => { setPage(1); setType(v); }}>
                <select
                  value={type}
                  onChange={(e) => {
                    setPage(1);
                    setType(e.target.value);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-red-400"
                >
                  <option value="">All</option>
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                </select>
              </Field>
              <Field label="Reference" value={reference} onChange={(v) => { setPage(1); setReference(v); }}>
                <select
                  value={reference}
                  onChange={(e) => {
                    setPage(1);
                    setReference(e.target.value);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-red-400"
                >
                  <option value="">All</option>
                  <option value="CHARGES">Platform charges</option>
                  <option value="ADS_PAYMENT">Ads</option>
                  <option value="LISTING_FEE">Listing fee</option>
                  <option value="LISTING_PREMIUM">Listing premium</option>
                  <option value="RELOCATION_POST_FEE">Relocate fee</option>
                  <option value="MAINTENANCE_FEE">Maintenance</option>
                  <option value="RENT_PAYMENT">Rent</option>
                  <option value="FUND_WALLET">Top-up</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="pb-2">When</th>
                    <th className="pb-2">User</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Reference</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-gray-500">
                        No transactions match these filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100 align-top">
                        <td className="py-2 text-gray-600 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2">
                          <p className="font-medium text-gray-800">{row.user.name || row.user.email || '—'}</p>
                          <p className="text-xs text-gray-500">{row.user.email}</p>
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              row.type === 'CREDIT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="py-2">
                          <p className="font-medium text-gray-800">{row.reference}</p>
                          <p className="max-w-xs truncate text-xs text-gray-500">
                            {row.description || row.referenceId}
                          </p>
                        </td>
                        <td className="py-2 font-semibold text-gray-800">
                          {money(row.amount, row.currency)}
                        </td>
                        <td className="py-2 text-gray-600">{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PlatformFinance;
