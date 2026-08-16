
import React, { useState, useRef, useEffect } from 'react';
import { Email } from '../types';
import { Inbox, Send, File, Trash2, Search, Star, X, Pencil, AlertCircle, ArrowLeft, Minimize2, Bold, Italic, List, Wand2, RotateCcw, Loader } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';
import { getEmailFolder, Email as ApiEmail, createEmail, markEmailAsRead, recoverEmail, updateEmailState } from '../services/emailService';
import { getMessagingContacts, MessagingContact } from '../services/contactsService';

const EmailSystem: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [systemUsers, setSystemUsers] = useState<MessagingContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'starred' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<MessagingContact | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEmails();
    // Refresh every 30 seconds
    const interval = setInterval(loadEmails, 30000);
    return () => clearInterval(interval);
  }, [activeFolder]);

  useEffect(() => {
    if (!isComposeOpen) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingContacts(true);
      try {
        const contacts = await getMessagingContacts(recipientSearch);
        if (!cancelled) setSystemUsers(contacts);
      } catch {
        if (!cancelled) setSystemUsers([]);
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [recipientSearch, isComposeOpen]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setSendError(null);
      {
        const response = await getEmailFolder(activeFolder, 1, 100, searchQuery);
        const mappedEmails: Email[] = response.data.map((e: ApiEmail) => {
          const senderName = e.sender?.profile?.fullname || 
                            (e.sender?.profile?.firstName && e.sender?.profile?.lastName
                              ? `${e.sender.profile.firstName} ${e.sender.profile.lastName}`.trim()
                              : e.sender?.profile?.firstName || e.senderEmail || 'Unknown');
          
          const receiverName = e.receiver?.profile?.fullname ||
                              (e.receiver?.profile?.firstName && e.receiver?.profile?.lastName
                                ? `${e.receiver.profile.firstName} ${e.receiver.profile.lastName}`.trim()
                                : e.receiver?.profile?.firstName || e.receiverEmail || 'Unknown');

          return {
            id: e.id,
            folder: activeFolder === 'starred' ? 'inbox' : activeFolder,
            from: {
              name: senderName,
              email: e.senderEmail,
            },
            to: e.receiverEmail ? [{ name: receiverName, email: e.receiverEmail }] : [],
            subject: e.subject,
            body: e.body,
            timestamp: new Date(e.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            isRead: e.isReadByReceiver || false,
            isStarred: Boolean((e as any).isStarred),
            hasAttachment: (e.attachment?.length || 0) > 0,
          };
        });
        setEmails(mappedEmails);
      }
    } catch (error: any) {
      setSendError(error?.message || 'Mail could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(e => {
    const matchesSearch = e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.from.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFolder === 'starred') {
      return e.isStarred && matchesSearch;
    }
    return e.folder === activeFolder && matchesSearch;
  });

  const filteredUsers = systemUsers.filter(u =>
    u.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    u.mailboxEmail.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedRecipient || !subject || !body) return;
    setIsSending(true);
    setSendError(null);
    try {
      await createEmail({
        subject,
        body,
        receiverId: selectedRecipient.userId,
      });
      await loadEmails();
      setIsComposeOpen(false);
      setRecipientSearch('');
      setSelectedRecipient(null);
      setSubject('');
      setBody('');
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error: any) {
      console.error('Error sending email:', error);
      setSendError(error?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!subject) return;
    setIsSending(true); setSendError(null);
    try {
      await createEmail({ subject, body, receiverId: selectedRecipient?.userId, isDraft: true });
      setIsComposeOpen(false); setSubject(''); setBody(''); setSelectedRecipient(null);
      if (activeFolder === 'drafts') await loadEmails();
    } catch (error: any) { setSendError(error?.message || 'Draft could not be saved.'); }
    finally { setIsSending(false); }
  };

  const handleAiDraft = async () => {
    if (!subject || !selectedRecipient) return;
    setIsDrafting(true);
    const draft = await generateEmailDraft(subject, selectedRecipient.relationship);
    setBody(draft);
    if (editorRef.current) editorRef.current.innerHTML = draft;
    setIsDrafting(false);
  };

  const toggleStar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const existing = emails.find((email) => email.id === id);
    if (!existing) return;
    try { await updateEmailState(id, { isStarred: !existing.isStarred }); await loadEmails(); }
    catch (error: any) { setSendError(error?.message || 'Message state could not be updated.'); }
  };

  const deleteEmail = async (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    if (activeFolder === 'trash') return;
    try { await updateEmailState(id, { isDeleted: true }); setSelectedEmail(null); await loadEmails(); }
    catch (error: any) { setSendError(error?.message || 'Message could not be moved to trash.'); }
  };

  const restoreEmail = async (id: string) => {
    try { await recoverEmail(id); setSelectedEmail(null); await loadEmails(); }
    catch (error: any) { setSendError(error?.message || 'Message could not be restored.'); }
  };

  const formatDoc = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) setBody(editorRef.current.innerHTML);
  };

  // Helpers
  const getAvatarColor = (name: string) => {
      const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700'];
      let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
  };
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button 
      onClick={() => { setActiveFolder(id as any); setSelectedEmail(null); }} 
      className={`w-full flex items-center justify-between px-6 py-2.5 rounded-r-full text-sm font-bold transition-all ${activeFolder === id ? 'bg-red-100/50 text-red-700 border-l-4 border-red-600' : 'text-gray-600 hover:bg-white/40 border-l-4 border-transparent'}`}
    >
       <div className="flex items-center gap-4"><Icon size={18} />{label}</div>
       {id === 'inbox' && <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{emails.filter((email) => email.folder === 'inbox' && !email.isRead).length}</span>}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 relative">
      {/* Sidebar */}
      <div className="w-64 flex flex-col py-2">
        <button onClick={() => { setIsComposeOpen(true); setComposeMinimized(false); setSendError(null); }} className="w-40 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl py-4 px-6 font-medium shadow-lg flex items-center gap-3 mb-6 border border-gray-100 group transition-all hover:scale-105"><Pencil className="text-red-600 group-hover:rotate-12 transition-transform" size={20} /><span className="text-sm font-bold tracking-wide">Compose</span></button>
        
        <div className="space-y-1 pr-4">
          <SidebarItem id="inbox" label="Inbox" icon={Inbox} />
          <SidebarItem id="starred" label="Starred" icon={Star} />
          <SidebarItem id="sent" label="Sent" icon={Send} />
          <SidebarItem id="drafts" label="Drafts" icon={File} />
          <SidebarItem id="trash" label="Trash" icon={Trash2} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/40 bg-white/40">
         {sendError && <div className="bg-red-50 px-4 py-2 text-sm text-red-800">{sendError}</div>}
         <div className="h-16 border-b border-white/30 bg-white/30 backdrop-blur-md flex items-center px-4 gap-4">
            {selectedEmail && <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-white/40 rounded-full text-gray-600"><ArrowLeft size={20} /></button>}
            <div className="flex-1 relative max-w-2xl">
               <Search className="absolute left-3 top-2.5 text-gray-500" size={18} /><input type="text" placeholder={`Search in ${activeFolder}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/50 border border-white/50 rounded-xl pl-10 pr-4 py-2 text-sm outline-none font-medium focus:bg-white/80 transition-all" />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/20">
            {loading ? (
               <div className="flex items-center justify-center h-full">
                  <Loader className="animate-spin text-red-600" size={32} />
               </div>
            ) : selectedEmail ? (
               <div className="p-8 animate-in fade-in">
                  {/* Detail Toolbar */}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 leading-snug">{selectedEmail.subject}</h2>
                    <div className="flex gap-2">
                      <button onClick={(e) => void toggleStar(e as any, selectedEmail.id)} className={`p-2 rounded-full hover:bg-white/50 transition ${selectedEmail.isStarred ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`}><Star size={20} /></button>
                      {selectedEmail.folder === 'trash' ? (
                         <button onClick={() => void restoreEmail(selectedEmail.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full" title="Restore"><RotateCcw size={20} /></button>
                      ) : (
                         <button onClick={(e) => void deleteEmail(e as any, selectedEmail.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={20} /></button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/30">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border shadow-sm ${getAvatarColor(selectedEmail.from.name)}`}>{getInitials(selectedEmail.from.name)}</div>
                     <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                           <h3 className="font-bold text-gray-900 text-lg">{selectedEmail.from.name}</h3>
                           <span className="text-xs font-bold text-gray-500 bg-white/40 px-2 py-1 rounded">{selectedEmail.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">&lt;{selectedEmail.from.email}&gt;</p>
                     </div>
                  </div>
                  
                  <div className="whitespace-pre-wrap text-gray-800 font-medium text-sm leading-relaxed min-h-[200px]">{selectedEmail.body.replace(/<[^>]*>/g, '')}</div>
               </div>
            ) : (
               filteredEmails.length > 0 ? (
                 filteredEmails.map(email => (
                    <div key={email.id} onClick={() => { setSelectedEmail(email); if (!email.isRead && email.folder === 'inbox') void markEmailAsRead(email.id).then(loadEmails).catch((e) => setSendError(e?.message || 'Message could not be marked as read.')); }} className="group flex items-center px-4 py-3.5 border-b border-white/30 hover:bg-white/60 cursor-pointer transition-colors">
                       <div className="flex items-center gap-3 mr-3 pl-2">
                          <button onClick={(e) => void toggleStar(e, email.id)} className={`hover:scale-110 transition-transform ${email.isStarred ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
                             <Star size={18} />
                          </button>
                       </div>
                       <div className="mr-4">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/40 shadow-sm ${getAvatarColor(email.from.name)}`}>
                             {getInitials(email.from.name)}
                          </div>
                       </div>
                       <div className={`w-48 truncate text-sm ${email.isRead ? 'font-bold text-gray-700' : 'font-extrabold text-gray-900'}`}>{email.from.name}</div>
                       <div className="flex-1 truncate text-sm text-gray-600 group-hover:text-gray-800">
                          <span className="font-bold text-gray-800">{email.subject}</span> 
                          <span className="text-gray-400 font-medium mx-1">-</span>
                          <span className="text-gray-500">{email.body.replace(/<[^>]*>?/gm, '').substring(0, 60)}...</span>
                       </div>
                       
                       {/* Hover Actions */}
                       <div className="w-32 flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeFolder === 'trash' ? (
                             <button onClick={(e) => {e.stopPropagation(); void restoreEmail(email.id)}} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Restore"><RotateCcw size={16}/></button>
                          ) : (
                             <button onClick={(e) => void deleteEmail(e, email.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Move to trash"><Trash2 size={16}/></button>
                          )}
                       </div>
                       <div className="w-20 text-right text-xs font-bold text-gray-500 group-hover:hidden">{email.timestamp}</div>
                    </div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mb-4">
                       {activeFolder === 'trash' ? <Trash2 size={32} /> : activeFolder === 'starred' ? <Star size={32} /> : <Inbox size={32} />}
                    </div>
                    <p className="font-bold">No messages in {activeFolder}</p>
                 </div>
               )
            )}
         </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && !composeMinimized && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 glass-modal-overlay transition-opacity" onClick={() => setComposeMinimized(true)}></div>
            <div className="relative w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-white/10" style={{ background: 'rgba(255, 255, 255, 0.40)', backdropFilter: 'blur(40px) saturate(150%)' }}>
               
               <div className="bg-white/10 border-b border-white/20 px-6 py-4 flex justify-between items-center backdrop-blur-md">
                  <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">New Message</h4>
                  <div className="flex gap-3"><button onClick={() => setComposeMinimized(true)}><Minimize2 size={18} /></button><button onClick={() => setIsComposeOpen(false)}><X size={20} /></button></div>
               </div>

               <div className="flex-1 flex flex-col">
                  <div className="px-8 py-4 border-b border-white/20 relative flex items-center gap-4 bg-white/5">
                     <span className="text-xs font-bold text-gray-500 uppercase w-12">To</span>
                     {selectedRecipient ? (
                        <span className="bg-red-50/80 border border-red-100 px-3 py-1 rounded-lg text-sm font-bold text-red-800 flex items-center gap-2">{selectedRecipient.name} <button onClick={() => setSelectedRecipient(null)}><X size={12}/></button></span>
                     ) : (
                        <div className="relative flex-1">
                           <input type="text" placeholder="Search users by name or email" value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} className="w-full bg-transparent outline-none text-sm font-medium" />
                           {(recipientSearch || loadingContacts || filteredUsers.length > 0) && (
                             <div className="absolute top-full left-0 w-96 bg-white/90 backdrop-blur-xl border rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 mt-2 p-1">
                               {loadingContacts ? (
                                 <div className="p-3 text-sm text-gray-500">Searching users...</div>
                               ) : filteredUsers.length > 0 ? (
                                 filteredUsers.map(u => (
                                   <div
                                     key={u.userId}
                                     onClick={() => { setSelectedRecipient(u); setRecipientSearch(''); }}
                                     className="p-2 hover:bg-red-50 rounded-lg cursor-pointer text-sm"
                                   >
                                     <div className="font-bold">{u.name}</div>
                                     <div className="text-xs text-gray-500">{u.email} · {u.relationship}</div>
                                   </div>
                                 ))
                               ) : (
                                 <div className="p-3 text-sm text-gray-500">No users found</div>
                               )}
                             </div>
                           )}
                        </div>
                     )}
                  </div>
                  <div className="px-8 py-4 border-b border-white/20 flex items-center gap-4 bg-white/5">
                     <span className="text-xs font-bold text-gray-500 uppercase w-12">Subject</span>
                     <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold" placeholder="Subject line..." />
                  </div>

                  <div className="px-6 py-3 bg-white/10 border-b border-white/20 flex items-center gap-1 backdrop-blur-sm justify-between">
                     <div className="flex gap-1">
                        <button onMouseDown={(e) => {e.preventDefault(); formatDoc('bold')}} className="p-2 hover:bg-white/30 rounded" title="Bold"><Bold size={18}/></button>
                        <button onMouseDown={(e) => {e.preventDefault(); formatDoc('italic')}} className="p-2 hover:bg-white/30 rounded" title="Italic"><Italic size={18}/></button>
                        <button onMouseDown={(e) => {e.preventDefault(); formatDoc('insertUnorderedList')}} className="p-2 hover:bg-white/30 rounded" title="List"><List size={18}/></button>
                     </div>
                     <button 
                        onClick={handleAiDraft} 
                        disabled={isDrafting || !subject} 
                        className="flex items-center gap-2 text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50"
                     >
                        <Wand2 size={14} /> {isDrafting ? 'Generating...' : 'AI Auto-Draft'}
                     </button>
                  </div>

                  <div className="flex-1 p-8 bg-white/20 relative">
                     <div ref={editorRef} contentEditable onInput={() => setBody(editorRef.current?.innerHTML || '')} className="w-full h-full outline-none text-base prose prose-red max-w-none" />
                  </div>

                  <div className="p-6 border-t border-white/20 flex justify-between items-center bg-white/10 backdrop-blur-md">
                     <div className="flex flex-col gap-2">
                       <div className="flex gap-2">
                       <button onClick={handleSend} disabled={!selectedRecipient || !subject || !body || isSending} className="bg-red-600 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">{isSending ? 'Sending...' : 'Send Message'} <Send size={18} /></button>
                       <button onClick={() => void handleSaveDraft()} disabled={isSending || !subject} className="bg-white/50 text-gray-700 px-4 py-3 rounded-xl text-sm font-bold hover:bg-white/80 disabled:opacity-50">Save Draft</button>
                       </div>
                       {sendError && <p className="text-sm font-medium text-red-600">{sendError}</p>}
                     </div>
                     <button onClick={() => setIsComposeOpen(false)} className="p-3 text-gray-400 hover:text-red-600 transition"><Trash2 size={20}/></button>
                  </div>
               </div>
            </div>
         </div>
      )}
      {isComposeOpen && composeMinimized && <div className="fixed bottom-0 right-10 w-80 bg-gray-900 text-white px-5 py-3 rounded-t-2xl cursor-pointer z-50 shadow-2xl border border-white/20" onClick={() => setComposeMinimized(false)}>New Message - <span className="text-gray-400 font-normal">Draft</span></div>}
    </div>
  );
};

export default EmailSystem;
