import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock3, ExternalLink, Globe2, Loader, RefreshCw, Server, Smartphone } from 'lucide-react';
import { DeploymentHealth, getSystemHealth } from '../services/analyticsService';

const statusStyles: Record<DeploymentHealth['status'], string> = {
  OPERATIONAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DEGRADED: 'bg-amber-50 text-amber-700 border-amber-200',
  DOWN: 'bg-red-50 text-red-700 border-red-200',
  NOT_CONFIGURED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const iconFor = (type: DeploymentHealth['type']) => type === 'Mobile App' ? Smartphone : type === 'Website' ? Globe2 : Server;

const formatDuration = (seconds?: number) => {
  if (seconds == null) return null;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m process uptime`;
};

const SystemMonitor: React.FC = () => {
  const [systems, setSystems] = useState<DeploymentHealth[]>([]);
  const [checkedAt, setCheckedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const health = await getSystemHealth();
      setSystems(health.systems || []);
      setCheckedAt(health.checkedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment checks could not be completed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const operational = systems.filter((system) => system.status === 'OPERATIONAL').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">Live deployment checks</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">System health</h2>
          <p className="mt-1 text-sm font-medium text-gray-600">Direct checks against configured Railway, Vercel and app health URLs. No synthetic uptime percentage.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-red-700 disabled:opacity-60">
          {loading ? <Loader size={17} className="animate-spin" /> : <RefreshCw size={17} />} Run diagnostics
        </button>
      </div>

      {error && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><p className="font-bold">Health data unavailable</p><p>{error}</p></div></div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Operational now</p><p className="mt-1 text-3xl font-bold text-gray-900">{operational} / {systems.length}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Need configuration</p><p className="mt-1 text-3xl font-bold text-gray-900">{systems.filter((s) => s.status === 'NOT_CONFIGURED').length}</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Last diagnostic</p><p className="mt-2 text-sm font-bold text-gray-900">{checkedAt ? new Date(checkedAt).toLocaleString() : 'Not completed'}</p></div>
      </div>

      {loading && systems.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-gray-200 bg-white text-gray-500"><Loader className="mr-2 animate-spin" /> Checking live deployments…</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {systems.map((system) => {
            const Icon = iconFor(system.type);
            const duration = formatDuration(system.processUptimeSeconds);
            return (
              <article key={system.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3"><span className="rounded-2xl bg-red-50 p-3 text-red-600"><Icon size={20} /></span><div className="min-w-0"><h3 className="truncate font-bold text-gray-900">{system.name}</h3><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{system.type} · {system.provider}</p></div></div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[system.status]}`}>{system.status.replace('_', ' ')}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Response</p><p className="mt-1 font-bold text-gray-900">{system.latencyMs == null ? '—' : `${system.latencyMs} ms`}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Checked</p><p className="mt-1 font-bold text-gray-900">{new Date(system.checkedAt).toLocaleTimeString()}</p></div></div>
                <p className="mt-4 min-h-10 text-sm leading-5 text-gray-600">{system.detail}</p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500"><span className="inline-flex items-center gap-1">{system.status === 'OPERATIONAL' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Activity size={14} />} {duration || system.version || 'Current reachability only'}</span>{system.url && <a href={system.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700">Open <ExternalLink size={13} /></a>}</div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><Clock3 className="mt-0.5 shrink-0" size={18} /><p>Historical provider uptime and deployment history require Railway/Vercel API credentials. Until configured, this page reports verified current reachability only.</p></div>
    </div>
  );
};

export default SystemMonitor;
