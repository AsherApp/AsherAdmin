import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Ticket, 
  FolderOpen, 
  Settings, 
  LogOut,
  Building2,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Mail,
  HelpCircle,
  ClipboardCheck,
  Wrench,
  Coins,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { logout } from '../services/authService';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const ADMIN_MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'systems', label: 'System Monitor', icon: Activity },
  { id: 'landlords', label: 'Landlords', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Wrench },
  { id: 'listing-monetization', label: 'Platform Pricing', icon: Coins },
  { id: 'finance', label: 'Platform Finance', icon: Wallet },
  { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3 },
  { id: 'compliance', label: 'Compliance', icon: ClipboardCheck },
  { id: 'tickets', label: 'Support Tickets', icon: Ticket },
  { id: 'email', label: 'Admin Mail', icon: Mail },
  { id: 'inbox', label: 'Admin Chat', icon: MessageSquare },
  { id: 'files', label: 'Asher Library', icon: FolderOpen },
  { id: 'support-content', label: 'Support Content', icon: HelpCircle },
];

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen border-r border-white/40 flex flex-col shadow-2xl fixed left-0 top-0 z-20 hidden md:flex bg-white/60 backdrop-blur-xl transition-all duration-300 ease-in-out`}>
      {/* Logo Area */}
      <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center' : 'px-8'} border-b border-white/30 bg-gradient-to-r from-red-600/90 to-red-700/90 backdrop-blur-md transition-all duration-300 overflow-hidden`}>
        <div className="flex items-center gap-2 text-white">
          <Building2 size={28} className="drop-shadow-md shrink-0" />
          <span className={`font-bold text-lg tracking-wide drop-shadow-md whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>Asher Admin</span>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-28 bg-white border border-white/40 shadow-md rounded-full p-1 text-gray-500 hover:text-red-600 z-30 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {ADMIN_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-white/80 text-red-600 shadow-lg shadow-red-500/10 ring-1 ring-white/60' 
                  : 'text-gray-600 hover:bg-white/50 hover:text-red-600 hover:shadow-md'
              }`}
            >
              <Icon 
                size={20} 
                className={`${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-red-500'} transition-colors shrink-0`} 
              />
              <span className={`font-medium z-10 relative ml-4 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>{item.label}</span>
              {isActive && <div className="absolute left-0 w-1 h-8 bg-red-500 rounded-r-full"></div>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/30 bg-white/30 backdrop-blur-sm space-y-1">
        <button 
            onClick={() => setCurrentTab('settings')}
            title={isCollapsed ? 'Settings' : ''}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 text-gray-600 hover:bg-white/60 hover:text-red-600 rounded-2xl transition-all hover:shadow-sm ${currentTab === 'settings' ? 'bg-white/60 text-red-600 shadow-sm' : ''}`}
        >
          <Settings size={20} className="shrink-0" />
          <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>Settings</span>
        </button>
        <button 
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : ''}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 text-gray-600 hover:bg-white/60 hover:text-red-600 rounded-2xl transition-all mt-1 hover:shadow-sm`}
        >
          <LogOut size={20} className="shrink-0" />
          <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
