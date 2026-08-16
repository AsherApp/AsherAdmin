import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, Percent, Wallet, Loader, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getRevenueSummary,
  getRevenueTimeseries,
  RevenueSummary,
  RevenueTimeseriesPoint,
  ReportGroupBy,
} from '../services/reportsService';

const GROUP_OPTIONS: { id: ReportGroupBy; label: string }[] = [
  { id: 'category', label: 'By category' },
  { id: 'property', label: 'By property' },
  { id: 'landlord', label: 'By landlord' },
  { id: 'vendor', label: 'By vendor' },
  { id: 'currency', label: 'By currency' },
  { id: 'month', label: 'By month' },
];

function formatMoney(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)}`;
  }
}

const FinancialReports: React.FC = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [timeseries, setTimeseries] = useState<RevenueTimeseriesPoint[]>([]);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('category');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextGroupBy: ReportGroupBy = groupBy) => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, seriesData] = await Promise.all([
        getRevenueSummary({ groupBy: nextGroupBy }),
        getRevenueTimeseries({ interval: 'day' }),
      ]);
      setSummary(summaryData);
      setTimeseries(seriesData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(groupBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGroupChange = (next: ReportGroupBy) => {
    setGroupBy(next);
    load(next);
  };

  const chartData = useMemo(
    () =>
      timeseries.map((p) => ({
        date: new Date(p.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        gross: p.grossAmount,
        fee: p.feeAmount,
      })),
    [timeseries]
  );

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Financial Reports</h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">
            Gross transaction volume vs. Asher's commission — real revenue events, not raw transaction rows.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-200 bg-red-50/50 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-6 -mt-6"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Gross Volume</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatMoney(summary?.grossVolume || 0)}</h3>
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl w-fit mt-3"><Wallet size={16} /></div>
        </div>
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-6 -mt-6"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Commission Revenue</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatMoney(summary?.commissionRevenue || 0)}</h3>
          <div className="p-2 bg-red-100 text-red-600 rounded-xl w-fit mt-3"><TrendingUp size={16} /></div>
        </div>
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-6 -mt-6"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Fee-for-Service Revenue</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatMoney(summary?.feeForServiceRevenue || 0)}</h3>
          <div className="p-2 bg-purple-100 text-purple-600 rounded-xl w-fit mt-3"><DollarSign size={16} /></div>
        </div>
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-6 -mt-6"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Asher Revenue</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatMoney(summary?.totalRevenue || 0)}</h3>
          <div className="p-2 bg-green-100 text-green-600 rounded-xl w-fit mt-3"><DollarSign size={16} /></div>
        </div>
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-6 -mt-6"></div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Blended Take Rate</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{(summary?.takeRatePercent || 0).toFixed(2)}%</h3>
          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl w-fit mt-3"><Percent size={16} /></div>
        </div>
      </div>

      {/* Time series */}
      <div className="glass-panel p-6 rounded-3xl h-80 flex flex-col">
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Gross Volume &amp; Commission Over Time</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.length > 0 ? chartData : [{ date: 'No data', gross: 0, fee: 0 }]}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              />
              <Area type="monotone" dataKey="gross" name="Gross Volume" stroke="#2563EB" fillOpacity={1} fill="url(#colorGross)" strokeWidth={2} />
              <Area type="monotone" dataKey="fee" name="Commission" stroke="#DC2626" fillOpacity={1} fill="url(#colorFee)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">Breakdown</h3>
          <div className="flex gap-1 bg-gray-100/70 p-1 rounded-xl">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleGroupChange(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  groupBy === opt.id ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200">
                <th className="pb-3 pr-4">Group</th>
                <th className="pb-3 pr-4">Gross</th>
                <th className="pb-3 pr-4">Commission / Fee</th>
                <th className="pb-3 pr-4">Net</th>
                <th className="pb-3">Events</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.breakdown || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                    No revenue events recorded yet for this period.
                  </td>
                </tr>
              ) : (
                summary!.breakdown!.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-white/40 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-gray-800">{row.group || 'Unassigned'}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatMoney(row.grossAmount)}</td>
                    <td className="py-3 pr-4 text-red-600 font-bold">{formatMoney(row.feeAmount)}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatMoney(row.netAmount)}</td>
                    <td className="py-3 text-gray-500">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
