import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, Loader, Lock, Shield, User } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { AdminProfile, getMyNotificationPreferences, getMyProfile, NotificationPreference, saveMyNotificationPreferences, updateMyPassword, updateMyProfile } from '../services/settingsService';

const Settings: React.FC = () => {
  const [tab, setTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [profile, setProfile] = useState<AdminProfile>({});
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ error?: boolean; text: string } | null>(null);
  const currentUser = getCurrentUser();
  const email = profile.users?.email || profile.user?.email || currentUser?.email || '';

  useEffect(() => {
    Promise.all([getMyProfile(), getMyNotificationPreferences()])
      .then(([p, prefs]) => { setProfile(p || {}); setPreferences(prefs); })
      .catch((e) => setNotice({ error: true, text: e?.message || 'Settings could not be loaded.' }))
      .finally(() => setLoading(false));
  }, []);

  const communication = useMemo(() => preferences.find((p) => p.category === 'COMMUNICATION') || ({ category: 'COMMUNICATION', channels: ['IN_APP', 'EMAIL'] } as NotificationPreference), [preferences]);
  const runSave = async (action: () => Promise<void>, success: string) => {
    setSaving(true); setNotice(null);
    try { await action(); setNotice({ text: success }); }
    catch (e: any) { setNotice({ error: true, text: e?.message || 'The change could not be saved.' }); }
    finally { setSaving(false); }
  };
  const toggleChannel = (channel: 'EMAIL' | 'SMS' | 'PUSH') => {
    const changed = communication.channels.includes(channel) ? communication.channels.filter((c) => c !== channel) : [...communication.channels, channel];
    const next = { ...communication, channels: changed.includes('IN_APP') ? changed : ['IN_APP', ...changed] } as NotificationPreference;
    setPreferences((items) => [...items.filter((p) => p.category !== 'COMMUNICATION'), next]);
  };
  const Toggle = ({ channel }: { channel: 'EMAIL' | 'SMS' | 'PUSH' }) => {
    const on = communication.channels.includes(channel);
    return <button type="button" role="switch" aria-checked={on} aria-label={`${channel} notifications`} onClick={() => toggleChannel(channel)} className={`w-12 h-6 rounded-full relative ${on ? 'bg-red-600' : 'bg-gray-300'}`}><span className={`w-4 h-4 bg-white rounded-full absolute top-1 ${on ? 'left-7' : 'left-1'}`} /></button>;
  };

  if (loading) return <div className="h-72 flex items-center justify-center"><Loader className="animate-spin text-red-600" /></div>;
  return <div className="space-y-6">
    <div><h2 className="text-3xl font-bold text-gray-800">Settings</h2><p className="text-sm text-gray-600 mt-1">Live account preferences from the Asher API.</p></div>
    {notice && <div className={`rounded-xl px-4 py-3 text-sm font-medium ${notice.error ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{notice.text}</div>}
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-60 glass-panel rounded-3xl p-2 h-fit">{[['profile','My Profile',User],['notifications','Notifications',Bell],['security','Security',Shield]].map(([id,label,Icon]: any) => <button key={id} onClick={() => { setTab(id); setNotice(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${tab === id ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'}`}><Icon size={18}/>{label}</button>)}</div>
      <div className="flex-1 glass-panel rounded-3xl p-6 md:p-8">
        {tab === 'profile' && <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl font-bold">{(profile.firstName || email || 'A')[0]?.toUpperCase()}</div><div><h3 className="font-bold text-xl">{profile.fullname || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Administrator'}</h3><p className="text-sm text-gray-500">Administrator</p></div></div>
          <div className="grid md:grid-cols-2 gap-4"><label className="text-xs font-bold text-gray-600">FIRST NAME<input value={profile.firstName || ''} onChange={(e) => setProfile({...profile, firstName:e.target.value})} className="glass-input mt-2 w-full p-3 rounded-xl text-sm" /></label><label className="text-xs font-bold text-gray-600">LAST NAME<input value={profile.lastName || ''} onChange={(e) => setProfile({...profile, lastName:e.target.value})} className="glass-input mt-2 w-full p-3 rounded-xl text-sm" /></label><label className="md:col-span-2 text-xs font-bold text-gray-600">EMAIL<input value={email} readOnly className="glass-input mt-2 w-full p-3 rounded-xl text-sm bg-gray-100" /><span className="block mt-1 normal-case font-normal text-gray-500">Email changes are not supported by the existing profile API.</span></label><label className="md:col-span-2 text-xs font-bold text-gray-600">ROLE TITLE<input value={profile.title || ''} onChange={(e) => setProfile({...profile,title:e.target.value})} className="glass-input mt-2 w-full p-3 rounded-xl text-sm" /></label></div>
          <button disabled={saving} onClick={() => runSave(async () => { const p = await updateMyProfile({firstName:profile.firstName,lastName:profile.lastName,title:profile.title}); setProfile((old) => ({...old,...p})); }, 'Profile saved.')} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50">{saving?'Saving…':'Save Profile'}</button>
        </div>}
        {tab === 'notifications' && <div className="max-w-2xl space-y-5"><h3 className="font-bold text-xl flex items-center gap-2"><Bell size={20}/> Admin communication alerts</h3><p className="text-sm text-gray-500">These preferences apply to communication involving this admin account. In-app alerts remain enabled.</p>{([['EMAIL','Email'],['PUSH','Push'],['SMS','SMS']] as const).map(([channel,label]) => <div key={channel} className="flex justify-between items-center border-b border-gray-100 py-4"><div><p className="font-bold text-sm">{label} notifications</p><p className="text-xs text-gray-500">Receive admin communication alerts by {label.toLowerCase()}.</p></div><Toggle channel={channel}/></div>)}<button disabled={saving} onClick={() => runSave(() => saveMyNotificationPreferences([communication]), 'Notification preferences saved.')} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50">{saving?'Saving…':'Save Preferences'}</button></div>}
        {tab === 'security' && <div className="max-w-2xl space-y-5"><h3 className="font-bold text-xl flex items-center gap-2"><Lock size={20}/> Change password</h3>{[['oldPassword','Current password'],['newPassword','New password'],['confirm','Confirm new password']].map(([key,label]) => <label key={key} className="block text-xs font-bold text-gray-600">{label.toUpperCase()}<input type="password" value={(passwords as any)[key]} onChange={(e) => setPasswords({...passwords,[key]:e.target.value})} className="glass-input mt-2 w-full p-3 rounded-xl text-sm" autoComplete={key==='oldPassword'?'current-password':'new-password'} /></label>)}<p className="text-xs text-gray-500">Use 8+ characters with uppercase, lowercase, a number and a special character.</p><button disabled={saving||!passwords.oldPassword||!passwords.newPassword||!passwords.confirm} onClick={() => { if(passwords.newPassword!==passwords.confirm){setNotice({error:true,text:'New passwords do not match.'});return;} void runSave(async()=>{await updateMyPassword(passwords.oldPassword,passwords.newPassword);setPasswords({oldPassword:'',newPassword:'',confirm:''});},'Password updated.'); }} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50">{saving?'Updating…':'Update Password'}</button><div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600"><CheckCircle size={16} className="inline mr-2"/>2FA is not shown as enabled because no existing 2FA management API is available.</div></div>}
      </div>
    </div>
  </div>;
};
export default Settings;
