
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Ticket, TicketPriority } from '../../types';
import { 
  Mail, Phone, Clock, KeyRound, MessageSquare, Shield, X, 
  Clock as ClockIcon, ChevronRight, AlertCircle, Plus, Save, Copy, Check,
  RefreshCw, Trash2, Link2, Loader, Eye, EyeOff
} from 'lucide-react';
import { getSystemDetails, getPriorityColor, getStatusColor } from '../../utils/uiHelpers';
import TicketDetailModal from '../tickets/TicketDetailModal';
import {
  resendLandlordInvite,
  cancelLandlordInvite,
  deleteLandlordAccount,
  setLandlordTempPassword,
  setLandlordSuspension,
} from '../../services/userService';
import {
  getTicketsByUserId,
  createTicket,
  mapApiTicketToUiTicket,
} from '../../services/ticketService';

interface UserDetailModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => void;
  onDelete: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'messages' | 'settings'>(
    user.status === 'Pending Invite' ? 'settings' : 'tickets'
  );
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  const [invitationLink, setInvitationLink] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [inviteLoading, setInviteLoading] = useState<'resend' | 'link' | 'temp' | 'cancel' | 'delete' | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const isPendingInvite = user.status === 'Pending Invite';

  // Create Ticket State
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({ subject: '', description: '', priority: TicketPriority.MEDIUM });

  const loadUserTickets = useCallback(async () => {
    if (user.status === 'Pending Invite') {
      setUserTickets([]);
      return;
    }

    setTicketsLoading(true);
    setTicketsError('');
    try {
      const response = await getTicketsByUserId(user.id);
      const mapped = response.data.map((t) =>
        mapApiTicketToUiTicket(t, user.systemId || '4')
      );
      setUserTickets(mapped);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load ticket history';
      setTicketsError(message);
      setUserTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, [user.id, user.status, user.systemId]);

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadUserTickets();
    }
  }, [activeTab, loadUserTickets]);

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setUserTickets(userTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setViewingTicket(updatedTicket);
  };

  const handleCreateTicket = async () => {
    if (!newTicketData.subject || !newTicketData.description) return;

    setCreatingTicket(true);
    setTicketsError('');
    try {
      const created = await createTicket({
        subject: newTicketData.subject,
        description: newTicketData.description,
        type: 'SUPPORT',
        priority: newTicketData.priority,
        raisedByUserId: user.id,
      });
      const mapped = mapApiTicketToUiTicket(created, user.systemId || '4');
      setUserTickets((prev) => [mapped, ...prev]);
      setShowCreateTicket(false);
      setNewTicketData({ subject: '', description: '', priority: TicketPriority.MEDIUM });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create ticket';
      setTicketsError(message);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleResendInvite = async () => {
    setInviteLoading('resend');
    setInviteError('');
    setInviteMessage('');
    try {
      const response = await resendLandlordInvite(user.id, true);
      const data = response.data?.data || response.data || response;
      setInvitationLink(data.invitationLink || '');
      setInviteMessage(
        data.emailSent
          ? 'Invitation email resent successfully.'
          : 'Email could not be sent. Copy the invitation link below instead.'
      );
    } catch (err: any) {
      setInviteError(err.message || 'Failed to resend invitation email');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleGenerateLink = async () => {
    setInviteLoading('link');
    setInviteError('');
    setInviteMessage('');
    try {
      const response = await resendLandlordInvite(user.id, false);
      const data = response.data?.data || response.data || response;
      setInvitationLink(data.invitationLink || '');
      setInviteMessage('Invitation link generated. Copy and share it directly.');
    } catch (err: any) {
      setInviteError(err.message || 'Failed to generate invitation link');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleSetTempPassword = async () => {
    if (tempPassword.length < 8) {
      setInviteError('Temporary password must be at least 8 characters.');
      return;
    }

    setInviteLoading('temp');
    setInviteError('');
    setInviteMessage('');
    try {
      const response = await setLandlordTempPassword(user.id, tempPassword);
      setInviteMessage(response.message || 'Temporary password set successfully.');
      onUpdate({ status: 'Active', lastActive: 'Ready to log in' });
      setTempPassword('');
    } catch (err: any) {
      setInviteError(err.message || 'Failed to set temporary password');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleCancelInvite = async () => {
    if (!window.confirm(`Cancel the invite for ${user.email}? This will remove the user from the directory.`)) {
      return;
    }

    setInviteLoading('cancel');
    setInviteError('');
    try {
      await cancelLandlordInvite(user.id);
      onDelete();
      onClose();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to cancel invitation');
      setInviteLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        `Permanently remove ${user.name}'s account (${user.email}) from the system?\n\nThis will:\n• Remove them from the admin directory\n• Deactivate their properties and tenants\n• Block all future sign-in\n\nThis cannot be undone.`
      )
    ) {
      return;
    }

    setInviteLoading('delete');
    setInviteError('');
    try {
      const response = await deleteLandlordAccount(user.id);
      setInviteMessage(response.message || 'Account deleted successfully.');
      onDelete();
      onClose();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to delete account');
      setInviteLoading(null);
    }
  };

  const handleToggleSuspension = async () => {
    const shouldSuspend = user.status !== 'Suspended';
    const actionLabel = shouldSuspend ? 'suspend' : 'reinstate';
    if (
      !window.confirm(
        shouldSuspend
          ? `Suspend ${user.name}'s account? They will be signed out and unable to log in until reinstated.`
          : `Reinstate ${user.name}'s account? They will be able to sign in again.`
      )
    ) {
      return;
    }

    setInviteLoading('suspend');
    setInviteError('');
    try {
      const response = await setLandlordSuspension(user.id, shouldSuspend);
      onUpdate({
        status: shouldSuspend ? 'Suspended' : 'Active',
        lastActive: shouldSuspend ? 'Suspended' : 'Offline',
      });
      setInviteMessage(response.message || `Account ${actionLabel}d successfully.`);
    } catch (err: any) {
      setInviteError(err.message || `Failed to ${actionLabel} account`);
    } finally {
      setInviteLoading(null);
    }
  };

  const handleCopyLink = () => {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTempPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
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
            <div className="mt-auto p-6 border-t border-white/20 bg-white/5 space-y-3">
               {isPendingInvite ? (
                 <button
                   onClick={() => setActiveTab('settings')}
                   className="w-full py-2.5 bg-red-50/80 hover:bg-red-100/80 border border-red-200/40 rounded-xl text-sm font-bold text-red-700 flex items-center justify-center gap-2 backdrop-blur-sm"
                 >
                   <Mail size={16} /> Manage Invitation
                 </button>
               ) : (
                 <button className="w-full py-2.5 bg-white/30 hover:bg-white/50 border border-white/40 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center gap-2 backdrop-blur-sm">
                   <KeyRound size={16} /> Reset Password
                 </button>
               )}
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
                     {ticketsError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-700">{ticketsError}</p>
                        </div>
                     )}

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
                                   disabled={creatingTicket}
                                   className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-red-700 transition disabled:opacity-50"
                                 >
                                   {creatingTicket ? (
                                     <><Loader size={14} className="animate-spin" /> Saving...</>
                                   ) : (
                                     <><Save size={14}/> Save Ticket</>
                                   )}
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}

                     {ticketsLoading && (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                          <Loader className="animate-spin text-red-600 mr-2" size={20} />
                          <span className="text-sm font-medium">Loading tickets...</span>
                        </div>
                     )}

                     {!ticketsLoading && userTickets.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <p className="text-sm font-medium">No support tickets for this user yet.</p>
                          <p className="text-xs mt-1 text-gray-400">Create one with the button above.</p>
                        </div>
                     )}

                     {!ticketsLoading && userTickets.map(t => {
                        const sys = getSystemDetails(t.sourceSystemId);
                        const SysIcon = sys.icon;
                        return (
                        <div key={t.id} onClick={() => setViewingTicket(t)} className="p-5 rounded-2xl hover:bg-white/40 cursor-pointer border border-white/40 shadow-sm bg-white/20 backdrop-blur-md group transition-all hover:scale-[1.01]">
                           <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                 <span className="font-mono text-[10px] font-bold text-gray-400 bg-white/50 px-1.5 py-0.5 rounded">{t.ticketCode || t.id}</span>
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
                    {!isPendingInvite && inviteError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700">{inviteError}</p>
                      </div>
                    )}

                    {isPendingInvite && (
                      <div className="p-6 rounded-2xl border border-amber-200/50 shadow-lg backdrop-blur-md bg-amber-50/20">
                        <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2 text-lg">
                          <Mail size={20} className="text-amber-600" /> Pending Invitation
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                          This user has not activated their account on the{' '}
                          <a href="https://asherlanlord.vercel.app" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">
                            Rent Management System
                          </a>{' '}
                          yet. Resend the email, share a direct link, or set a temporary password they can use to log in at asherlanlord.vercel.app.
                        </p>

                        {inviteError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-600" />
                            <p className="text-sm text-red-700">{inviteError}</p>
                          </div>
                        )}

                        {inviteMessage && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm text-green-700">{inviteMessage}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleResendInvite}
                              disabled={inviteLoading !== null}
                              className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                              {inviteLoading === 'resend' ? <Loader className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                              Resend Email
                            </button>
                            <button
                              onClick={handleGenerateLink}
                              disabled={inviteLoading !== null}
                              className="px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm font-bold text-gray-700 flex items-center gap-2 disabled:opacity-50"
                            >
                              {inviteLoading === 'link' ? <Loader className="animate-spin" size={16} /> : <Link2 size={16} />}
                              Get Invite Link
                            </button>
                          </div>

                          {invitationLink && (
                            <div className="p-4 rounded-xl bg-white/40 border border-white/50">
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Invitation Link</label>
                              <div className="flex gap-2">
                                <input
                                  readOnly
                                  value={invitationLink}
                                  className="glass-input flex-1 p-3 rounded-xl text-xs font-medium bg-white/50"
                                />
                                <button
                                  onClick={handleCopyLink}
                                  className="p-3 bg-white/60 border border-white/50 rounded-xl text-gray-600 hover:text-red-600"
                                >
                                  {copiedLink ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="p-4 rounded-xl bg-white/40 border border-white/50 space-y-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Set Temporary Password</label>
                            <p className="text-xs text-gray-500">Give the user a password to log in at asherlanlord.vercel.app if email delivery fails. They can change it after signing in.</p>
                            <div className="relative">
                              <input
                                type={showTempPassword ? 'text' : 'password'}
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                className="glass-input w-full p-3 pr-24 rounded-xl text-sm bg-white/50"
                              />
                              <div className="absolute right-2 top-2 flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setShowTempPassword((prev) => !prev)}
                                  className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                  {showTempPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                {tempPassword && (
                                  <button
                                    type="button"
                                    onClick={handleCopyTempPassword}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                  >
                                    {copiedPassword ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={handleSetTempPassword}
                              disabled={inviteLoading !== null || tempPassword.length < 8}
                              className="px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                              {inviteLoading === 'temp' ? <Loader className="animate-spin" size={16} /> : <KeyRound size={16} />}
                              Set Temp Password
                            </button>
                          </div>

                          <div className="p-4 rounded-xl border border-red-200/50 bg-red-50/20 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-red-800">Cancel Invitation</p>
                              <p className="text-xs text-red-600 mt-1">Remove this pending user from the directory.</p>
                            </div>
                            <button
                              onClick={handleCancelInvite}
                              disabled={inviteLoading !== null}
                              className="px-4 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                              {inviteLoading === 'cancel' ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                              Cancel Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6 rounded-2xl border border-red-200/40 shadow-lg backdrop-blur-md bg-red-50/20">
                       <h3 className="font-bold text-red-900 mb-6 flex items-center gap-2 text-lg"><Shield size={20} className="text-red-600" /> Administrative Actions</h3>
                       <div className="space-y-4">
                         {!isPendingInvite && (
                           <div className="flex items-center justify-between p-4 border border-red-100/40 rounded-xl bg-white/30 hover:bg-white/50 transition backdrop-blur-sm shadow-sm">
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                {user.status === 'Suspended' ? 'Reinstate Account' : 'Suspend Account'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {user.status === 'Suspended'
                                  ? 'Restore login access for this landlord.'
                                  : 'Temporarily disable login and API access.'}
                              </p>
                            </div>
                            <button
                              onClick={handleToggleSuspension}
                              disabled={inviteLoading !== null}
                              className="px-4 py-2 rounded-lg text-xs font-bold border border-red-200 text-red-700 hover:bg-red-50 bg-white/50 flex items-center gap-2 disabled:opacity-50"
                            >
                              {inviteLoading === 'suspend' ? <Loader className="animate-spin" size={14} /> : null}
                              {user.status === 'Suspended' ? 'Activate' : 'Suspend'}
                            </button>
                         </div>
                         )}

                         {!isPendingInvite && (
                           <div className="flex items-center justify-between p-4 border border-red-200/50 rounded-xl bg-white/30 hover:bg-white/50 transition backdrop-blur-sm shadow-sm">
                             <div>
                               <p className="text-sm font-bold text-red-800">Delete Account</p>
                               <p className="text-xs text-gray-500 mt-1">
                                 Permanently remove this landlord from the system, including deactivating their properties and tenants.
                               </p>
                             </div>
                             <button
                               onClick={handleDeleteAccount}
                               disabled={inviteLoading !== null}
                               className="px-4 py-2 rounded-lg text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 bg-white/50 flex items-center gap-2 disabled:opacity-50"
                             >
                               {inviteLoading === 'delete' ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />}
                               Delete
                             </button>
                           </div>
                         )}
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
