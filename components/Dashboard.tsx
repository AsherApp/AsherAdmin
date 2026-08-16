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

  useEffect(() => {
    loadDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data...');
      const [statsData, activityData, health] = await Promise.all([
        getSystemStats(),
        getActivityData(),
        getSystemHealth().catch(() => null),
      ]);
      console.log('✅ Dashboard data loaded:', { statsData, activityData, health });
      setStats(statsData);
      setActivityData(activityData);
      setBackendHealth(health);
    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      // Set empty stats on error to prevent UI breaking
      setStats({
        totalUsers: 0,
        totalTenants: 0,
        totalProperties: 0,
        openTickets: 0,
        resolvedTickets: 0,
        totalTickets: 0,
        totalEmails: 0,
        unreadEmails: 0,
        totalDocuments: 0,
        activeUsers: 0,
        userGrowth: 0,
      });
      setActivityData([]);
      setBackendHealth(null);
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm mt-1 font-medium">Welcome back. Here is what's happening across the nexus.</p>
      </div>

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
            <span className="text-xs text-gray-500 font-medium mt-2 block px-1">Currently online</span>
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

        {/* Backend Status — real data only; the other apps (tenant/vendor
            mobile, listing website) have no health-check endpoint yet, so
            we don't fabricate scores for them here. */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6 text-lg">Backend Status</h3>
          {backendHealth ? (
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  backendHealth.status === 'OPERATIONAL' ? 'bg-green-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                  backendHealth.status === 'DEGRADED' ? 'bg-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' :
                  backendHealth.status === 'MAINTENANCE' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]' :
                  'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                } animate-pulse`}></span>
                <span className="text-lg font-bold text-gray-800">{backendHealth.name || 'Rent Mgmt System'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/30 rounded-xl p-3 border border-white/40">
                  <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                  <p className="text-sm font-bold text-gray-800">{backendHealth.status}</p>
                </div>
                <div className="bg-white/30 rounded-xl p-3 border border-white/40">
                  <p className="text-xs text-gray-500 font-medium mb-1">Uptime</p>
                  <p className="text-sm font-bold text-gray-800">{Math.round(backendHealth.uptime || 0)}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Other apps (tenant/vendor mobile, listing website) aren't wired to live monitoring yet — see System Monitor.
              </p>
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
            {backendHealth && (
               <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-3 h-3 rounded-full ${
                       backendHealth.status === 'OPERATIONAL' ? 'bg-green-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                       backendHealth.status === 'DEGRADED' ? 'bg-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                       backendHealth.status === 'MAINTENANCE' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' :
                       'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                     }`}></div>
                     <span className="text-sm font-semibold text-gray-800">
                        {backendHealth.name || 'Rent Management System'} {backendHealth.status === 'OPERATIONAL' ? 'Operational' : backendHealth.status.charAt(0) + backendHealth.status.slice(1).toLowerCase()}
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