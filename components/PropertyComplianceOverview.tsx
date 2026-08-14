import React, { useEffect, useState } from 'react';
import { AlertTriangle, Building2, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  getComplianceOverview,
  type ComplianceOverviewResponse,
} from '../services/complianceService';

const PropertyComplianceOverview: React.FC = () => {
  const [data, setData] = useState<ComplianceOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await getComplianceOverview());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-gray-500">
        Loading compliance overview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-red-600" size={28} />
            Property compliance oversight
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Platform-wide operational profile completeness and certificate status
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-white/60 shadow-sm hover:bg-white text-sm font-medium"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { label: 'Properties tracked', value: summary?.totalProperties ?? 0, icon: Building2 },
          { label: 'Avg completeness', value: `${summary?.averageCompleteness ?? 0}%`, icon: ShieldCheck },
          { label: 'Incomplete profiles', value: summary?.incompleteProperties ?? 0, icon: AlertTriangle },
          { label: 'Expired cert issues', value: summary?.propertiesWithExpiredCerts ?? 0, icon: AlertTriangle },
          { label: 'Energy letting blocks', value: summary?.meesBlockedProperties ?? 0, icon: AlertTriangle },
          { label: 'Unprotected deposits', value: summary?.unprotectedDeposits ?? 0, icon: AlertTriangle },
          { label: 'Documents overdue', value: summary?.statutoryOverdue ?? 0, icon: AlertTriangle },
          { label: 'Licensing incomplete', value: summary?.licensingIncomplete ?? 0, icon: AlertTriangle },
        ].map((card) => (
          <div key={card.label} className="glass-panel rounded-2xl p-5">
            <card.icon size={20} className="text-red-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50 border-b border-white/40">
            <tr>
              <th className="text-left p-4 font-semibold">Property</th>
              <th className="text-left p-4 font-semibold">Landlord</th>
              <th className="text-left p-4 font-semibold">Location</th>
              <th className="text-left p-4 font-semibold">Score</th>
              <th className="text-left p-4 font-semibold">Issues</th>
            </tr>
          </thead>
          <tbody>
            {(data?.properties ?? []).map((row) => (
              <tr key={row.propertyId} className="border-b border-white/30 hover:bg-white/30">
                <td className="p-4">
                  <p className="font-medium text-gray-900">{row.propertyName}</p>
                  <p className="text-xs text-gray-500">{row.specificationType}</p>
                </td>
                <td className="p-4 text-gray-600">{row.landlordEmail || row.landlordName || '—'}</td>
                <td className="p-4 text-gray-600">{row.country}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      row.complete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {row.completenessScore}%
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-600">
                  {[
                    ...row.expired.map((e) => `Expired: ${e}`),
                    ...row.missing.map((m) => `Missing: ${m}`),
                    ...(row.meesBlocked ? ['Energy rating too low to let'] : []),
                    ...(row.unprotectedDeposits ? [`${row.unprotectedDeposits} unprotected deposit(s)`] : []),
                    ...(row.statutoryOverdue ? [`${row.statutoryOverdue} document(s) overdue`] : []),
                    ...(row.licensingIncomplete ? ['Licensing reference missing'] : []),
                  ]
                    .slice(0, 4)
                    .join(' · ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyComplianceOverview;
