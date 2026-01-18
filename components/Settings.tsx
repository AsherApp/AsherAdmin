import React, { useState } from 'react';
import { User, Bell, Shield, Globe, Mail, Lock, CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

  const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-red-500/50 ${enabled ? 'bg-red-600' : 'bg-gray-300'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform duration-200 ease-in-out ${enabled ? 'left-7' : 'left-1'}`}></div>
    </button>
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Settings</h2>
        <p className="text-gray-600 text-sm mt-1 font-medium">Manage your preferences and account security.</p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 glass-panel rounded-3xl overflow-hidden flex flex-col p-2 border border-white/40">
           {[
             { id: 'profile', label: 'My Profile', icon: User },
             { id: 'notifications', label: 'Notifications', icon: Bell },
             { id: 'security', label: 'Security & Login', icon: Shield },
             { id: 'system', label: 'System Prefs', icon: Globe },
           ].map((tab) => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm mb-1 ${
                    isActive ? 'bg-white shadow-sm text-red-600 ring-1 ring-black/5' : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                 }`}
               >
                 <Icon size={18} className={isActive ? 'text-red-500' : 'text-gray-400'} />
                 {tab.label}
               </button>
             );
           })}
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel rounded-3xl p-8 overflow-y-auto custom-scrollbar relative border border-white/40">
           
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

           {activeTab === 'profile' && (
             <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-6 mb-8">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-xl flex items-center justify-center text-4xl font-bold text-white border-4 border-white/50 ring-4 ring-white/20">
                      A
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-gray-800">Admin User</h3>
                      <p className="text-gray-500 font-medium">Super Administrator</p>
                      <button className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition hover:shadow-sm">Change Avatar</button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">First Name</label>
                      <input type="text" defaultValue="Admin" className="glass-input w-full p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white/40" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Last Name</label>
                      <input type="text" defaultValue="User" className="glass-input w-full p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white/40" />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                        <input type="email" defaultValue="admin@nexusprop.com" className="glass-input w-full pl-10 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white/40" />
                      </div>
                   </div>
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Role Title</label>
                      <input type="text" defaultValue="Head of Operations" className="glass-input w-full p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none bg-white/40" />
                   </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-white/30">
                   <button className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-red-700 hover:shadow-red-500/30 transition active:scale-95 flex items-center gap-2">
                     Save Profile
                   </button>
                </div>
             </div>
           )}

           {activeTab === 'notifications' && (
             <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
                <div className="bg-white/40 rounded-2xl p-6 border border-white/50 shadow-sm">
                   <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Bell size={18} className="text-red-500"/> Alert Preferences</h3>
                   <p className="text-sm text-gray-500 mb-6">Manage how you receive critical system updates.</p>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-bold text-gray-700 text-sm">Email Notifications</p>
                            <p className="text-xs text-gray-500">Receive daily summaries and critical alerts.</p>
                         </div>
                         <Toggle enabled={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} />
                      </div>
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-bold text-gray-700 text-sm">Push Notifications</p>
                            <p className="text-xs text-gray-500">Real-time alerts on your mobile device.</p>
                         </div>
                         <Toggle enabled={notifications.push} onChange={() => setNotifications({...notifications, push: !notifications.push})} />
                      </div>
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-bold text-gray-700 text-sm">SMS Alerts</p>
                            <p className="text-xs text-gray-500">Urgent system downtime notifications only.</p>
                         </div>
                         <Toggle enabled={notifications.sms} onChange={() => setNotifications({...notifications, sms: !notifications.sms})} />
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'security' && (
             <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
                 <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100">
                    <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2"><Lock size={18}/> Password & Authentication</h3>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Current Password</label>
                          <input type="password" value="********" className="glass-input w-full p-3 rounded-xl text-sm bg-white/30" disabled />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">New Password</label>
                          <input type="password" placeholder="Enter new password" className="glass-input w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white/60" />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Confirm New Password</label>
                          <input type="password" placeholder="Confirm new password" className="glass-input w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white/60" />
                       </div>
                       <div className="flex justify-end pt-2">
                          <button className="bg-white border border-red-200 text-red-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-red-50 transition shadow-sm">Update Password</button>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/40 rounded-2xl p-6 border border-white/50 flex items-center justify-between shadow-sm">
                    <div>
                       <p className="font-bold text-gray-800 text-sm">Two-Factor Authentication (2FA)</p>
                       <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 flex items-center gap-2 hover:bg-green-700 transition">
                       <CheckCircle size={16} />
                       Enabled
                    </button>
                 </div>
             </div>
           )}
           
           {activeTab === 'system' && (
              <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
                 <div className="bg-white/40 rounded-2xl p-6 border border-white/50 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Appearance</h3>
                    <div className="grid grid-cols-3 gap-4">
                       <button className="p-4 rounded-xl border-2 border-red-500 bg-white shadow-sm flex flex-col items-center gap-2">
                          <div className="w-full h-12 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200 shadow-inner">
                             <div className="absolute top-0 left-0 w-full h-4 bg-red-500"></div>
                          </div>
                          <span className="text-xs font-bold text-gray-800">Light (Default)</span>
                       </button>
                       <button className="p-4 rounded-xl border-2 border-transparent hover:border-gray-300 bg-white/50 flex flex-col items-center gap-2 transition">
                           <div className="w-full h-12 bg-gray-800 rounded-lg overflow-hidden relative border border-gray-700 shadow-inner">
                             <div className="absolute top-0 left-0 w-full h-4 bg-gray-900"></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600">Dark Mode</span>
                       </button>
                    </div>
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default Settings;