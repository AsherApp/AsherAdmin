import React, { useEffect, useState } from 'react';
import { MonitoredSystem, SystemStatus } from '../types';
import { Server, Smartphone, Globe } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { getSystemHealth, getActivityData } from '../services/analyticsService';

const SystemMonitor: React.FC = () => {
  const [activityData, setActivityData] = useState<any[]>([]);

  // Only Rent Mgmt System (id: '4') is wired to live health data today (see
  // getSystemHealth() below). The other apps are real products but have no
  // health-check/analytics endpoint yet — show them as not-yet-monitored
  // rather than inventing uptime/user numbers for them.
  const [systems, setSystems] = useState<MonitoredSystem[]>([
    { id: '1', name: 'Tenant Portal Mobile', type: 'Mobile App', status: SystemStatus.NOT_MONITORED, uptime: null, activeUsers: null, lastCheck: 'Not integrated', version: '—' },
    { id: '2', name: 'Vendor Mobile App', type: 'Mobile App', status: SystemStatus.NOT_MONITORED, uptime: null, activeUsers: null, lastCheck: 'Not integrated', version: '—' },
    { id: '3', name: 'Listing Website', type: 'Website', status: SystemStatus.NOT_MONITORED, uptime: null, activeUsers: null, lastCheck: 'Not integrated', version: '—' },
    { id: '4', name: 'Rent Mgmt System', type: 'Web App', status: SystemStatus.OPERATIONAL, uptime: 0, activeUsers: 0, lastCheck: 'Loading...', version: 'v3.1.0' }, // Replaced with real data below
    { id: '5', name: 'Admin Dashboard', type: 'Web App', status: SystemStatus.NOT_MONITORED, uptime: null, activeUsers: null, lastCheck: 'Not integrated', version: '—' },
  ]);

  useEffect(() => {
    loadSystemHealth();
    loadActivityData();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemHealth();
      loadActivityData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      console.log('🔄 Loading Rent Management System health...');
      const health = await getSystemHealth();
      console.log('✅ System health loaded:', health);

      // Update Rent Mgmt System in systems array with real data
      setSystems(prevSystems => {
        return prevSystems.map(sys => {
          if (sys.id === '4') {
            // Map backend status to SystemStatus enum
            let status = SystemStatus.OPERATIONAL;
            if (health.status === 'OPERATIONAL') {
              status = SystemStatus.OPERATIONAL;
            } else if (health.status === 'DEGRADED') {
              status = SystemStatus.DEGRADED;
            } else if (health.status === 'DOWN') {
              status = SystemStatus.DOWN;
            } else if (health.status === 'MAINTENANCE') {
              status = SystemStatus.MAINTENANCE;
            }
            
            return {
              ...sys,
              name: health.name || 'Rent Mgmt System',
              type: health.type || 'Web App',
              status: status,
              uptime: Math.round(health.uptime || 0),
              activeUsers: health.activeUsers || 0,
              lastCheck: health.lastCheck || 'Just now',
              version: health.version || 'v3.1.0',
            };
          }
          return sys;
        });
      });
    } catch (error: any) {
      console.error('❌ Error loading system health:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
      });
      // Keep existing data on error, don't reset to mock
    }
  };

  const loadActivityData = async () => {
    try {
      console.log('🔄 Loading activity data...');
      const response = await getActivityData();
      console.log('✅ Activity data loaded:', response);
      
      // Handle both direct array and wrapped response
      const activity = Array.isArray(response) ? response : [];
      
      // Transform activity data for chart (last 7 days)
      // Calculate total activity per day (users + tickets)
      const chartData = activity.map((item: any) => ({
        time: item.name || 'Day', // Day name (e.g., "Mon", "Tue")
        load: (item.users || 0) + (item.tickets || 0), // Total activity
        users: item.users || 0,
        tickets: item.tickets || 0,
      }));
      setActivityData(chartData);
    } catch (error: any) {
      console.error('❌ Error loading activity data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
      });
      // Fallback to empty array if error
      setActivityData([]);
    }
  };

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case SystemStatus.OPERATIONAL: return 'bg-green-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]';
      case SystemStatus.DEGRADED: return 'bg-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]';
      case SystemStatus.MAINTENANCE: return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]';
      case SystemStatus.DOWN: return 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]';
      case SystemStatus.NOT_MONITORED: return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getIcon = (type: string) => {
    if (type === 'Mobile App') return <Smartphone size={20} />;
    if (type === 'Website') return <Globe size={20} />;
    return <Server size={20} />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">System Live Monitor</h2>
          <p className="text-gray-600 text-sm font-medium">Real-time health check of the 5-system ecosystem.</p>
        </div>
        <button className="bg-white/60 backdrop-blur-md border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 hover:shadow-lg transition-all">
          Run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {systems.map((sys) => (
          <div key={sys.id} className="glass-panel rounded-3xl p-6 relative overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-2xl">
            {/* Gradient Glow Background */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity ${sys.status === SystemStatus.OPERATIONAL ? 'bg-green-500' : sys.status === SystemStatus.DEGRADED ? 'bg-yellow-500' : sys.status === SystemStatus.NOT_MONITORED ? 'bg-gray-400' : 'bg-blue-500'}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl text-red-600 shadow-sm border border-white/50">
                  {getIcon(sys.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{sys.name}</h3>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{sys.type}</span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm border ${
                sys.status === SystemStatus.OPERATIONAL ? 'bg-green-100/60 text-green-700 border-green-200' :
                sys.status === SystemStatus.DEGRADED ? 'bg-yellow-100/60 text-yellow-700 border-yellow-200' :
                sys.status === SystemStatus.NOT_MONITORED ? 'bg-gray-100/60 text-gray-500 border-gray-200' :
                'bg-blue-100/60 text-blue-700 border-blue-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(sys.status)} ${sys.status !== SystemStatus.NOT_MONITORED ? 'animate-pulse' : ''}`}></span>
                {sys.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-white/30 rounded-xl p-3 border border-white/40">
                <p className="text-xs text-gray-500 font-medium mb-1">Uptime</p>
                <p className="text-xl font-bold text-gray-800">{sys.uptime === null ? '—' : `${sys.uptime}%`}</p>
              </div>
              <div className="bg-white/30 rounded-xl p-3 border border-white/40">
                <p className="text-xs text-gray-500 font-medium mb-1">Active Users</p>
                <p className="text-xl font-bold text-gray-800">{sys.activeUsers === null ? '—' : sys.activeUsers.toLocaleString()}</p>
              </div>
            </div>

            <div className="h-20 w-full opacity-80 relative z-10 -ml-2">
              <ResponsiveContainer width="105%" height="100%">
                <AreaChart data={
                  // Only the Rent Mgmt System (id: '4') has a real activity
                  // feed; every other system shows an empty chart until it's
                  // actually integrated with live monitoring.
                  sys.id === '4' ? activityData : []
                }>
                   <defs>
                    <linearGradient id={`grad-${sys.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="load" 
                    stroke="#DC2626" 
                    fill={`url(#grad-${sys.id})`} 
                    strokeWidth={3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200/50 flex justify-between items-center text-xs text-gray-500 font-medium relative z-10">
               <span className="bg-white/40 px-2 py-1 rounded-lg">Version: {sys.version}</span>
               <span>Last check: {sys.lastCheck}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemMonitor;