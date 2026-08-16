import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar, { ADMIN_MENU_ITEMS } from './components/Sidebar';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import { Menu, Bell, CheckCircle, AlertTriangle, Info, MessageCircle } from 'lucide-react';
import { AppNotification } from './types';
import { getCurrentUser, isAdminUser, isAuthenticated, logout } from './services/authService';
import { getAllNotifications, markAllAsRead, clearAllNotifications, markAsRead, Notification } from './services/notificationService';
import {
  connectAdminNotifications,
  disconnectAdminNotifications,
  subscribeAdminLiveNotifications,
} from './services/notificationSocket';

const Dashboard = lazy(() => import('./components/Dashboard'));
const SystemMonitor = lazy(() => import('./components/SystemMonitor'));
const TicketSystem = lazy(() => import('./components/TicketSystem'));
const FileLibrary = lazy(() => import('./components/FileLibrary'));
const LandlordsSection = lazy(() => import('./components/LandlordsSection'));
const VendorsSection = lazy(() => import('./components/VendorsSection'));
const ListingMonetizationConfig = lazy(() => import('./components/ListingMonetizationConfig'));
const PlatformFinance = lazy(() => import('./components/PlatformFinance'));
const FinancialReports = lazy(() => import('./components/FinancialReports'));
const PropertyComplianceOverview = lazy(() => import('./components/PropertyComplianceOverview'));
const Inbox = lazy(() => import('./components/Inbox'));
const EmailSystem = lazy(() => import('./components/EmailSystem'));
const Settings = lazy(() => import('./components/Settings'));
const SupportContent = lazy(() => import('./components/SupportContent'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated() || !isAdminUser()) {
    logout();
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Helper function to format timestamp
const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

// Helper function to map backend notification category to frontend type
const mapCategoryToType = (category?: string): 'alert' | 'success' | 'message' | 'info' => {
  if (!category) return 'info';
  const cat = category.toUpperCase();
  if (cat.includes('ALERT') || cat.includes('WARNING') || cat.includes('ERROR')) return 'alert';
  if (cat.includes('SUCCESS') || cat.includes('COMPLETE')) return 'success';
  if (cat.includes('MESSAGE') || cat.includes('COMMUNICATION')) return 'message';
  return 'info';
};

// Helper function to convert backend notification to frontend format
const convertNotification = (notif: Notification): AppNotification => {
  return {
    id: notif.id,
    type: mapCategoryToType(notif.category),
    title: notif.title,
    message: notif.message,
    timestamp: formatTimestamp(notif.createdAt),
    isRead: notif.isRead,
    actionLink: notif.route,
  };
};

// Main Dashboard Layout Component
const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeTab = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const currentTab = ADMIN_MENU_ITEMS.some((item) => item.id === routeTab) || routeTab === 'settings' ? routeTab : 'dashboard';
  const setCurrentTab = (tab: string) => navigate(tab === 'dashboard' ? '/' : `/${tab}`);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState('');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadNotifications = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) {
        setLoadingNotifications(true);
      }
      const response = await getAllNotifications();
      setNotificationError('');
      const converted = response.notifications.map(convertNotification);
      setNotifications(converted);
    } catch (error: any) {
      setNotificationError(error?.message || 'Notifications could not be loaded.');
    } finally {
      if (!opts?.silent) {
        setLoadingNotifications(false);
      }
    }
  };

  // Load notifications on mount, poll as fallback, and live socket updates
  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications({ silent: true });
    }, 30000);

    const user = getCurrentUser();
    const token = localStorage.getItem('admin_token');
    if (user?.id && token) {
      connectAdminNotifications(user.id, token);
    }

    const unsubscribe = subscribeAdminLiveNotifications((payload) => {
      const live: AppNotification = {
        id: String(payload.id ?? Date.now()),
        type: mapCategoryToType(payload.category as string | undefined),
        title: String(payload.title ?? 'Notification'),
        message: String(payload.message ?? ''),
        timestamp: formatTimestamp(
          String(payload.timestamp ?? payload.createdAt ?? new Date().toISOString())
        ),
        isRead: false,
        actionLink:
          (payload.actionUrl as string | undefined) ??
          (payload.route as string | undefined),
      };
      setNotifications((prev) => {
        if (prev.some((n) => n.id === live.id)) return prev;
        return [live, ...prev];
      });
      void loadNotifications({ silent: true });
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      disconnectAdminNotifications();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({...n, isRead: true})));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }
      if (notification.actionLink) {
        try {
          const target = new URL(notification.actionLink, window.location.origin);
          if (target.origin === window.location.origin) navigate(target.pathname + target.search);
        } catch {
          // Ignore malformed or external routes from notification payloads.
        }
      }
      setShowNotifications(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'systems': return <SystemMonitor />;
      case 'landlords': return <LandlordsSection />;
      case 'vendors': return <VendorsSection />;
      case 'listing-monetization': return <ListingMonetizationConfig />;
      case 'finance': return <PlatformFinance />;
      case 'financial-reports': return <FinancialReports />;
      case 'compliance': return <PropertyComplianceOverview />;
      case 'tickets': return <TicketSystem />;
      case 'inbox': return <Inbox />;
      case 'email': return <EmailSystem />;
      case 'files': return <FileLibrary />;
      case 'support-content': return <SupportContent />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle size={18} className="text-red-500" />;
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'message': return <MessageCircle size={18} className="text-blue-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-full h-full flex font-sans text-slate-800 selection:bg-red-200 selection:text-red-900 relative overflow-x-hidden">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      {/* Mobile Header - Glass */}
      <div className="md:hidden fixed top-0 w-full bg-red-600/90 backdrop-blur-md border-b border-white/20 z-30 flex items-center justify-between px-4 h-16 shadow-lg">
         <span className="text-white font-bold text-lg tracking-wide">Asher Admin</span>
         <div className="flex items-center gap-2">
            <button 
               onClick={() => setShowNotifications(!showNotifications)}
               className="relative p-2 text-white/80 hover:bg-white/10 rounded-lg"
            >
               <Bell size={24} />
               {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-red-600"></span>}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 hover:bg-white/10 rounded-lg">
               <Menu size={24} />
            </button>
         </div>
      </div>

      {/* Notification Button (Desktop Floating) */}
      <div className="fixed top-4 right-6 z-50 hidden md:block">
         <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-full shadow-lg transition-all duration-300 border border-white/40 ${
               showNotifications 
               ? 'bg-red-600 text-white rotate-12 shadow-red-500/30' 
               : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-600 backdrop-blur-xl'
            }`}
         >
            <div className="relative">
               <Bell size={20} />
               {unreadCount > 0 && !showNotifications && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                  </span>
               )}
            </div>
         </button>

         {/* Notification Dropdown/Panel */}
         {showNotifications && (
            <div className="absolute top-12 right-0 w-96 glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 border border-white/60 origin-top-right bg-white/80 backdrop-blur-2xl ring-1 ring-black/5">
               <div className="p-4 border-b border-white/30 bg-white/40 backdrop-blur-md flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-gray-800">Notifications</h3>
                     <p className="text-xs text-gray-500 font-medium">{unreadCount} unread alerts</p>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={handleMarkAllRead} className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-white/50 text-xs font-bold" title="Mark all read">Read All</button>
                     <button onClick={handleClearNotifications} className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-white/50 text-xs font-bold" title="Clear">Clear</button>
                  </div>
               </div>
               
               <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {notificationError && <div className="m-2 rounded-xl bg-red-50 p-3 text-xs text-red-800">{notificationError}</div>}
                  {loadingNotifications ? (
                     <div className="p-8 text-center text-gray-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-20 animate-pulse" />
                        <p className="text-sm font-medium">Loading notifications...</p>
                     </div>
                  ) : notifications.length > 0 ? (
                     notifications.map(notif => (
                        <div 
                           key={notif.id} 
                           onClick={() => handleNotificationClick(notif)}
                           className={`p-3 mb-2 rounded-xl flex gap-3 items-start transition-colors cursor-pointer ${notif.isRead ? 'bg-white/20 hover:bg-white/40 opacity-80' : 'bg-white/60 hover:bg-white/80 border-l-4 border-l-red-500 shadow-sm'}`}
                        >
                           <div className={`mt-0.5 p-1.5 rounded-full bg-white/50 shadow-sm`}>
                              {getNotifIcon(notif.type)}
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-start">
                                 <h4 className={`text-sm ${notif.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{notif.title}</h4>
                                 <span className="text-[10px] text-gray-400 font-bold">{notif.timestamp}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 leading-snug">{notif.message}</p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="p-8 text-center text-gray-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium">No new notifications.</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>

      {/* Mobile Menu Overlay - Glass */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 glass-modal-overlay z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="glass-panel w-64 h-full pt-20 px-4 border-r border-white/50" onClick={(e) => e.stopPropagation()}>
              {[...ADMIN_MENU_ITEMS, { id: 'settings', label: 'Settings', icon: Info }].map((item) => (
                <button key={item.id} onClick={() => { setCurrentTab(item.id); setIsMobileMenuOpen(false); }} className={`block w-full text-left py-3 px-2 border-b border-white/20 font-medium hover:bg-white/40 rounded-lg transition-all ${currentTab === item.id ? 'text-red-700 bg-white/60' : ''}`}>{item.label}</button>
              ))}
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} p-6 md:px-8 md:pb-8 md:pt-16 pt-20 transition-all duration-300 ease-in-out`}>
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<div className="h-72 flex items-center justify-center text-sm font-medium text-gray-500">Loading section…</div>}>{renderContent()}</Suspense>
        </div>
      </main>
    </div>
  );
};

// Main App Component with Routing
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
