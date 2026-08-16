import React, { useEffect, useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Activity,
  Loader
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getSystemStats, getActivityData, getSystemHealth, SystemStats, ActivityData, SystemHealth } from '../services/analyticsService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [backendHealth, setBackendHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, activityData, health] = await Promise.all([
        getSystemStats(),
        getActivityData(),
        getSystemHealth().catch(() => null),
      ]);
      setStats(statsData);
      setActivityData(activityData);
      setBackendHealth(health);
    } catch (error: any) {
      setError(error?.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-red-600" size={32} />
      </div>
    );
  }
  if (error && !stats) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center"><h2 className="font-bold text-red-800">Dashboard unavailable</h2><p className="mt-1 text-sm text-red-700">{error}</p><button onClick={() => void loadDashboardData()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Try again</button></div>;
  }
  const deployments = backendHealth?.systems || [];
  const healthyDeployments = deployments.filter((system) => system.status === 'OPERATIONAL').length;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm mt-1 font-medium">Welcome back. Here is what is happening across the Asher suite.</p>
      </div>

      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Some dashboard data could not refresh: {error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group transition-transform hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.totalUsers || 0}</h3>
            <span className="text-xs text-green-600 font-bold flex items-center mt-2 bg-green-100/50 px-2 py-0.5 rounded-full w-fit">
              <TrendingUp size={12} className="mr-1"/> 
              {stats?.userGrowth ? (stats.userGrowth > 0 ? '+' : '') + stats.userGrowth + '%' : '0%'} this week
            </span>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl shadow-lg shadow-red-500/30">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group transition-transform hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Open Tickets</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.openTickets || 0}</h3>
            <span className="text-xs text-gray-500 font-medium mt-2 block px-1">Total: {stats?.totalTickets || 0}</span>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-lg shadow-orange-500/30">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group transition-transform hover:-translate-y-1 hover:shadow-xl">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Active Users</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.activeUsers || 0}</h3>
            <span className="text-xs text-gray-500 font-medium mt-2 block px-1">Active in the last 15 minutes</span>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <Activity size={24} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl flex items-center justify-between relative overflow-hidden group transition-transform hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Resolved Tickets</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats?.resolvedTickets || 0}</h3>
            <span className="text-xs text-green-600 font-bold mt-2 block px-1">Total resolved</span>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-green-500/30">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6 text-lg">User Activity vs Support Volume</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData.length > 0 ? activityData : [{ name: 'No Data', users: 0, tickets: 0 }]}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4B5563" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4B5563" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="#DC2626" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                <Area type="monotone" dataKey="tickets" stroke="#4B5563" fillOpacity={1} fill="url(#colorTickets)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direct deployment status; detailed checks live in System Monitor. */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6 text-lg">Deployment Status</h3>
          {deployments.length ? (
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${healthyDeployments === deployments.length ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                <span className="text-lg font-bold text-gray-800">{healthyDeployments} of {deployments.length} operational</span>
              </div>
              <div className="space-y-2">{deployments.slice(0, 4).map((system) => <div key={system.id} className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2 text-xs"><span className="font-semibold text-gray-700">{system.name}</span><span className={system.status === 'OPERATIONAL' ? 'font-bold text-emerald-700' : system.status === 'NOT_CONFIGURED' ? 'font-bold text-gray-500' : 'font-bold text-amber-700'}>{system.status.replace('_', ' ')}</span></div>)}</div>
              <p className="text-xs text-gray-400 font-medium">Current reachability only; open System Monitor for providers, latency and configuration gaps.</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium">
              Backend status unavailable
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Activity Mini List */}
      <div className="glass-panel p-6 rounded-3xl">
         <h3 className="font-bold text-gray-800 mb-4 text-lg">Recent System Alerts</h3>
         <div className="space-y-4">
            {stats && stats.openTickets > 0 && (
               <div className="flex items-center justify-between p-4 bg-red-50/50 backdrop-blur-sm rounded-2xl border border-red-100/50 hover:bg-red-50/80 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.5)]"></div>
                     <span className="text-sm font-semibold text-gray-800">
                        {stats.openTickets} Open Ticket{stats.openTickets !== 1 ? 's' : ''} in Rent Management System
                     </span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white/60 px-3 py-1 rounded-full">Just now</span>
               </div>
            )}
            {stats && stats.unreadEmails > 0 && (
               <div className="flex items-center justify-between p-4 bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-100/50 hover:bg-blue-50/80 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"></div>
                     <span className="text-sm font-semibold text-gray-800">
                        {stats.unreadEmails} Unread Email{stats.unreadEmails !== 1 ? 's' : ''}
                     </span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white/60 px-3 py-1 rounded-full">Just now</span>
               </div>
            )}
            {deployments.length > 0 && (
               <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${healthyDeployments === deployments.length ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                     <span className="text-sm font-semibold text-gray-800">
                        Deployment check: {healthyDeployments} operational, {deployments.length - healthyDeployments} need attention or configuration
                     </span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white/60 px-3 py-1 rounded-full">Just now</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
