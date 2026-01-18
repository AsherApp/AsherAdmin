
import React, { useState } from 'react';
import { UserProfile, Ticket, TicketStatus, TicketPriority } from '../../types';
import { 
  Mail, Phone, Clock, KeyRound, Ticket as TicketIcon, MessageSquare, Shield, X, 
  Clock as ClockIcon, ChevronRight, AlertCircle, Plus, Save
} from 'lucide-react';
import { getSystemDetails, getPriorityColor, getStatusColor } from '../../utils/uiHelpers';
import TicketDetailModal from '../tickets/TicketDetailModal';

// Mock Ticket Data for Drill-down
const mockUserTickets: Ticket[] = [
  { 
    id: 'NET-1024', 
    sourceSystemId: '1', 
    subject: 'Cannot login to Tenant Portal', 
    description: 'I keep getting error 500 whenever I try to access the payment history tab on my iPhone.', 
    user: 'Sarah Jenkins', 
    userId: 'u1', 
    status: TicketStatus.OPEN, 
    priority: TicketPriority.HIGH, 
    createdAt: '2023-10-27T10:00:00Z', 
    messages: [{id:'m1', sender:'User', text:'Help please', timestamp:'10:00'}] 
  },
  { 
    id: 'NET-1099', 
    sourceSystemId: '1', 
    subject: 'Lease renewal question', 
    description: 'Where do I sign the new lease document sent to my email? The link seems broken.', 
    user: 'Sarah Jenkins', 
    userId: 'u1', 
    status: TicketStatus.RESOLVED, 
    priority: TicketPriority.LOW, 
    createdAt: '2023-10-15T09:00:00Z', 
    messages: [] 
  }
];

interface UserDetailModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => void;
  onDelete: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'messages' | 'settings'>('tickets');
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [userTickets, setUserTickets] = useState<Ticket[]>(mockUserTickets);

  // Create Ticket State
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({ subject: '', description: '', priority: TicketPriority.MEDIUM });

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setUserTickets(userTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setViewingTicket(updatedTicket);
  };

  const handleCreateTicket = () => {
    if (!newTicketData.subject || !newTicketData.description) return;

    const newTicket: Ticket = {
      id: `NET-${Math.floor(Math.random() * 10000)}`,
      sourceSystemId: user.systemId,
      subject: newTicketData.subject,
      description: newTicketData.description,
      user: user.name,
      userId: user.id,
      status: TicketStatus.OPEN,
      priority: newTicketData.priority,
      createdAt: new Date().toISOString(),
      messages: []
    };

    setUserTickets([newTicket, ...userTickets]);
    setShowCreateTicket(false);
    setNewTicketData({ subject: '', description: '', priority: TicketPriority.MEDIUM });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 glass-modal-overlay transition-opacity" onClick={onClose}></div>
        <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-white/10" style={{ background: 'rgba(255, 255, 255, 0.30)', backdropFilter: 'blur(40px) saturate(150%)' }}>
          
          {/* Sidebar */}
          <div className="w-80 border-r border-white/20 flex flex-col overflow-y-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
            <div className="p-8 flex flex-col items-center border-b border-white/20 bg-gradient-to-b from-white/10 to-transparent">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-5 ring-4 ring-white/20 backdrop-blur-md">{user.name.charAt(0)}</div>
              <h3 className="text-xl font-bold text-gray-900 text-center tracking-tight">{user.name}</h3>
              <p className="text-gray-600 text-sm mb-5 font-medium">{user.email}</p>
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${user.status === 'Active' ? 'bg-green-100/30 text-green-800 border-green-200/40' : 'bg-red-100/30 text-red-800 border-red-200/40'}`}>{user.status} Account</div>
            </div>
            <div className="p-6 space-y-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-medium bg-white/20 p-3 rounded-xl border border-white/30"><Mail size={16} className="text-red-600"/> <span className="truncate">{user.email}</span></div>
                  <div className="flex items-center gap-3 text-sm font-medium bg-white/20 p-3 rounded-xl border border-white/30"><Phone size={16} className="text-red-600"/> <span>{user.phone || 'No phone'}</span></div>
                  <div className="flex items-center gap-3 text-sm font-medium bg-white/20 p-3 rounded-xl border border-white/30"><Clock size={16} className="text-red-600"/> <span>{user.lastActive}</span></div>
               </div>
            </div>
            <div className="mt-auto p-6 border-t border-white/20 bg-white/5">
               <button className="w-full py-2.5 bg-white/30 hover:bg-white/50 border border-white/40 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center gap-2 backdrop-blur-sm"><KeyRound size={16} /> Reset Password</button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
            <div className="h-18 border-b border-white/20 flex items-center justify-between px-8 bg-white/10 backdrop-blur-sm">
               <div className="flex gap-8 h-full pt-4">
                  <button onClick={() => setActiveTab('tickets')} className={`h-full border-b-2 px-2 text-sm font-bold ${activeTab === 'tickets' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500'}`}>Tickets</button>
                  <button onClick={() => setActiveTab('messages')} className={`h-full border-b-2 px-2 text-sm font-bold ${activeTab === 'messages' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500'}`}>Messages</button>
                  <button onClick={() => setActiveTab('settings')} className={`h-full border-b-2 px-2 text-sm font-bold ${activeTab === 'settings' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500'}`}>Settings</button>
               </div>
               <button onClick={onClose} className="text-gray-500 hover:text-red-600 p-2"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               {activeTab === 'tickets' && (
                  <div className="space-y-4 max-w-3xl">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">Ticket History</h3>
                        <button 
                          onClick={() => setShowCreateTicket(!showCreateTicket)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${showCreateTicket ? 'bg-gray-200 text-gray-600 border-gray-300' : 'bg-red-50/40 text-red-700 border-red-100/60 hover:bg-red-50/60'}`}
                        >
                          {showCreateTicket ? <X size={14}/> : <Plus size={14}/>} 
                          {showCreateTicket ? 'Cancel Creation' : 'Create Ticket'}
                        </button>
                     </div>

                     {/* Inline Create Ticket Form */}
                     {showCreateTicket && (
                        <div className="p-5 rounded-2xl bg-white/40 border border-red-200/50 shadow-lg mb-6 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
                           <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><Plus size={16} className="text-red-600"/> New Ticket for {user.name}</h4>
                           <div className="space-y-3">
                              <input 
                                type="text" 
                                placeholder="Subject" 
                                value={newTicketData.subject}
                                onChange={(e) => setNewTicketData({...newTicketData, subject: e.target.value})}
                                className="glass-input w-full p-2.5 rounded-xl text-sm font-medium bg-white/40"
                              />
                              <textarea 
                                placeholder="Description of the issue..." 
                                value={newTicketData.description}
                                onChange={(e) => setNewTicketData({...newTicketData, description: e.target.value})}
                                className="glass-input w-full p-2.5 rounded-xl text-sm font-medium bg-white/40 min-h-[80px] resize-none"
                              />
                              <div className="flex justify-between items-center pt-2">
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">Priority:</span>
                                    <select 
                                      value={newTicketData.priority}
                                      onChange={(e) => setNewTicketData({...newTicketData, priority: e.target.value as TicketPriority})}
                                      className="glass-input py-1 px-2 rounded-lg text-xs font-bold bg-white/40 cursor-pointer"
                                    >
                                       {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                 </div>
                                 <button 
                                   onClick={handleCreateTicket}
                                   className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-red-700 transition"
                                 >
                                   <Save size={14}/> Save Ticket
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}

                     {userTickets.map(t => {
                        const sys = getSystemDetails(t.sourceSystemId);
                        const SysIcon = sys.icon;
                        return (
                        <div key={t.id} onClick={() => setViewingTicket(t)} className="p-5 rounded-2xl hover:bg-white/40 cursor-pointer border border-white/40 shadow-sm bg-white/20 backdrop-blur-md group transition-all hover:scale-[1.01]">
                           <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                 <span className="font-mono text-[10px] font-bold text-gray-400 bg-white/50 px-1.5 py-0.5 rounded">{t.id}</span>
                                 <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${sys.color} border-opacity-20`}>
                                    <SysIcon size={10} />
                                    <span className="truncate max-w-[80px]">{sys.name}</span>
                                 </div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><ClockIcon size={12} /> {new Date(t.createdAt).toLocaleDateString()}</span>
                           </div>
                           <h4 className="font-bold text-gray-800 text-sm">{t.subject}</h4>
                           <div className="flex gap-2 mt-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(t.status)}`}>{t.status}</span>
                              <div className="ml-auto flex items-center text-xs text-gray-500 font-bold group-hover:text-red-600 transition-colors">View <ChevronRight size={14} /></div>
                           </div>
                        </div>
                     )})}
                  </div>
               )}
               {activeTab === 'messages' && (
                  <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                    <div className="text-center">
                       <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                       <p>No active chat sessions found.</p>
                    </div>
                  </div>
               )}
               {activeTab === 'settings' && (
                 <div className="max-w-2xl space-y-6">
                    <div className="p-6 rounded-2xl border border-red-200/40 shadow-lg backdrop-blur-md bg-red-50/20">
                       <h3 className="font-bold text-red-900 mb-6 flex items-center gap-2 text-lg"><Shield size={20} className="text-red-600" /> Administrative Actions</h3>
                       <div className="flex items-center justify-between p-4 border border-red-100/40 rounded-xl bg-white/30 hover:bg-white/50 transition backdrop-blur-sm shadow-sm">
                          <div><p className="text-sm font-bold text-gray-800">Suspend Account</p><p className="text-xs text-gray-500 mt-1">Temporarily disable access.</p></div>
                          <button onClick={() => onUpdate({status: user.status === 'Active' ? 'Suspended' : 'Active'})} className="px-4 py-2 rounded-lg text-xs font-bold border border-red-200 text-red-700 hover:bg-red-50 bg-white/50">{user.status === 'Active' ? 'Suspend' : 'Activate'}</button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Drill Down Modal */}
      {viewingTicket && (
        <TicketDetailModal 
          ticket={viewingTicket} 
          onClose={() => setViewingTicket(null)} 
          onUpdate={handleTicketUpdate} 
        />
      )}
    </>
  );
};

export default UserDetailModal;
