
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { X, ArrowRight, CheckCircle, Copy, Check, Mail, Loader, AlertCircle } from 'lucide-react';
import { getSystemDetails } from '../../utils/uiHelpers';
import { inviteLandlordForFE } from '../../services/userService';

interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: UserProfile) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onAdd }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ name: '', email: '', system: '4', role: 'Landlord' }); // Default to Rent Mgmt Sys and Landlord
  const [invitationLink, setInvitationLink] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUserId, setCreatedUserId] = useState('');

  const handleCreate = async () => {
    if (!form.email) {
      setError('Email is required');
      return;
    }

    // Only allow creating Landlords for Rent Mgmt System (system 4)
    if (form.system !== '4' || form.role !== 'Landlord') {
      setError('Only Landlords can be created for the Rent Management System');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Split name into first and last
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Invite landlord via API
      const response = await inviteLandlordForFE({
        email: form.email,
        firstName,
        lastName,
      });

      // Create user profile for display
      const newUser: UserProfile = {
        id: response.userId || `u${Date.now()}`,
        name: form.name || 'New Landlord',
        email: form.email,
        role: 'Landlord',
        systemId: '4', // Rent Mgmt System
        status: 'Pending Invite',
        lastActive: 'Invitation sent',
        ticketsRaised: 0,
        phone: '',
      };

      onAdd(newUser);
      setCreatedUserId(response.userId);
      setInvitationLink(response.invitationLink || '');
      setEmailSent(response.emailSent !== false);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to invite landlord. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 glass-modal-overlay backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 relative border border-white/30 ring-1 ring-white/20" style={{ background: 'rgba(255, 255, 255, 0.40)', backdropFilter: 'blur(40px) saturate(150%)' }}>
        
        <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/10 backdrop-blur-md">
          <h3 className="font-bold text-xl text-gray-800">{step === 'form' ? 'Create New User' : 'Onboarding Initiated'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition"><X size={24}/></button>
        </div>

        {step === 'form' ? (
          <>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="glass-input w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white/30" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="glass-input w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white/30" placeholder="john@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">System</label>
                  <select value={form.system} onChange={(e) => setForm({...form, system: e.target.value})} className="glass-input w-full p-3 rounded-xl text-sm font-medium appearance-none bg-white/30 cursor-pointer" disabled>
                    <option value="4">Rent Mgmt System</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Creates a landlord account on{' '}
                    <a href="https://asherlanlord.vercel.app" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">
                      asherlanlord.vercel.app
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                  <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="glass-input w-full p-3 rounded-xl text-sm font-medium appearance-none bg-white/30 cursor-pointer" disabled>
                    <option>Landlord</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only Landlord role available</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-white/10 border-t border-white/20 flex justify-end gap-3 backdrop-blur-md">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-white/30 rounded-xl transition" disabled={loading}>Cancel</button>
              <button onClick={handleCreate} disabled={loading} className="px-6 py-2 bg-red-600/90 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Inviting...
                  </>
                ) : (
                  <>
                    Create & Invite <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-8 flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-300">
              <div className="w-16 h-16 bg-green-100/50 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-lg border border-green-200/50 backdrop-blur-md"><CheckCircle size={32} /></div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Invitation Sent!</h4>
              <p className="text-sm text-gray-600 font-medium max-w-xs mb-8 leading-relaxed">
                {emailSent ? (
                  <>
                    An invitation email has been sent to <b>{form.email}</b> for the{' '}
                    <b>Rent Management System</b> (AsherLandlordFE).
                    <br /><br />
                    They will set their password at{' '}
                    <a href="https://asherlanlord.vercel.app/set-password" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">
                      asherlanlord.vercel.app
                    </a>{' '}
                    and log in there — not on this admin panel.
                    <br /><br />
                    Ask them to check inbox and spam. Email is sent from <b>admin@ashercorp.co.uk</b>.
                  </>
                ) : (
                  <>
                    The landlord account was created for <b>{form.email}</b>, but the email could not be delivered.
                    <br /><br />
                    Copy the invitation link below and send it to them manually.
                  </>
                )}
              </p>
              {invitationLink && (
                <div className="w-full mb-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-left">
                    {emailSent ? 'Invitation Link (backup copy)' : 'Invitation Link (send manually)'}
                  </label>
                  <div className="flex gap-2">
                    <div className="glass-input flex-1 p-3 rounded-xl text-sm font-medium bg-white/40 text-gray-600 truncate border border-white/50">{invitationLink}</div>
                    <button onClick={handleCopy} className="p-3 bg-white/50 hover:bg-white/80 border border-white/50 rounded-xl text-gray-600 hover:text-red-600 transition shadow-sm">{copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {emailSent
                      ? 'If they do not receive the email, share this link directly.'
                      : 'Email delivery failed, so this link must be shared manually.'}
                  </p>
                </div>
              )}
              <div className={`w-full p-4 border rounded-xl ${emailSent ? 'bg-green-50/50 border-green-200/50' : 'bg-amber-50/50 border-amber-200/50'}`}>
                <p className={`text-sm font-medium ${emailSent ? 'text-green-700' : 'text-amber-800'}`}>
                  {emailSent ? (
                    <>
                      Invitation email sent successfully.<br />
                      If it is not in the inbox, check spam or promotions.
                    </>
                  ) : (
                    <>
                      Account created, but email was not delivered.<br />
                      Use the invitation link above instead.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="p-4 bg-white/10 border-t border-white/20 flex justify-center backdrop-blur-md">
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 font-bold transition">Close & Return</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddUserModal;

