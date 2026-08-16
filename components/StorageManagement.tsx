import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Database, HardDrive, RefreshCw, Search, Users } from 'lucide-react';
import { getStorageOverview, StorageOverview } from '../services/storageService';

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index >= 3 ? 2 : 1)} ${units[index]}`;
};

const StorageManagement: React.FC = () => {
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setOverview(await getStorageOverview());
    } catch (err: any) {
      setError(err?.message || 'Storage usage could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const landlords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return overview?.landlords || [];
    return (overview?.landlords || []).filter(item =>
      `${item.name} ${item.email}`.toLowerCase().includes(query)
    );
  }, [overview, search]);

  if (loading && !overview) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">Loading live storage usage…</div>;
  }

  if (error && !overview) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-semibold"><AlertCircle size={18} /> Storage unavailable</div>
        <p className="mt-1 text-sm">{error}</p>
        <button onClick={load} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Try again</button>
      </div>
    );
  }

  const account = overview!.account;
  const trackedBytes = overview!.landlords.reduce((sum, item) => sum + item.usedBytes, 0);
  const allocatedBytes = overview!.landlords.reduce((sum, item) => sum + item.quotaBytes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">System owner view</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Storage management</h2>
          <p className="mt-1 text-sm text-gray-500">Live provider totals and the 5 GB allowance assigned to each landlord.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Provider storage', value: formatBytes(account.storageBytes), detail: account.provider, icon: Database },
          { label: 'Provider credits', value: account.creditsLimit == null ? 'Not reported' : `${account.creditsUsed?.toFixed(2) || '0'} / ${account.creditsLimit.toFixed(0)}`, detail: account.creditsRemaining == null ? 'Shared provider allowance' : `${account.creditsRemaining.toFixed(2)} credits left`, icon: HardDrive },
          { label: 'Landlord usage tracked', value: formatBytes(trackedBytes), detail: `${overview!.landlords.length} landlord${overview!.landlords.length === 1 ? '' : 's'}`, icon: Users },
          { label: 'App quota allocated', value: formatBytes(allocatedBytes), detail: '5 GB per landlord', icon: HardDrive },
        ].map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{value}</p><p className="mt-1 text-xs capitalize text-gray-400">{detail}</p></div>
              <span className="rounded-xl bg-red-50 p-2.5 text-red-600"><Icon size={19} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-bold text-gray-900">Landlord allowances</h3><p className="text-xs text-gray-500">Usage includes owned documents, agreements and property media.</p></div>
          <div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search landlord" className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80"><tr>{['Landlord', 'Files', 'Used', 'Remaining', 'Allowance'].map(label => <th key={label} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {landlords.map(item => (
                <tr key={item.landlordId} className="hover:bg-gray-50/70">
                  <td className="px-5 py-4"><p className="font-semibold text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{item.email}</p></td>
                  <td className="px-5 py-4 text-sm text-gray-700">{item.totalFiles.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatBytes(item.usedBytes)}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{formatBytes(item.remainingBytes)}</td>
                  <td className="min-w-56 px-5 py-4"><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-gray-700">{item.usedPercent.toFixed(1)}%</span><span className="text-gray-400">{formatBytes(item.quotaBytes)}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${item.usedPercent >= 90 ? 'bg-red-600' : item.usedPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, item.usedPercent)}%` }} /></div>{item.extraQuotaBytes > 0 && <p className="mt-1 text-[11px] text-emerald-600">Includes {formatBytes(item.extraQuotaBytes)} purchased</p>}{!item.isComplete && <p className="mt-1 text-[11px] text-amber-600">Some legacy asset sizes are unavailable</p>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {landlords.length === 0 && <p className="p-10 text-center text-sm text-gray-500">No landlords match this search.</p>}
        </div>
      </div>
      <p className="text-xs text-gray-400">Provider reading updated {new Date(account.measuredAt).toLocaleString()}. Provider credits are shared across storage, bandwidth and transformations; they are not gigabytes.</p>
    </div>
  );
};

export default StorageManagement;
