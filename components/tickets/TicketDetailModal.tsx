
import React, { useState, useRef, useEffect } from 'react';
import { Ticket, TicketPriority, TicketStatus, TicketMessage, TicketHistory } from '../../types';
import { analyzeTicketWithAI } from '../../services/geminiService';
import { addMessageToTicket, getTicketById, mapApiTicketToUiTicket, updateTicket, updateTicketStatus } from '../../services/ticketService';
import { 
  X, Wand2, History, Send, ChevronDown, Clock,
  FileText, List, Bold, Italic, Underline, Link as LinkIcon, ListOrdered
} from 'lucide-react';
import { getSystemDetails, getPriorityColor } from '../../utils/uiHelpers';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (updatedTicket: Ticket) => void | Promise<void>;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string, suggestion: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [actionError, setActionError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyEditorRef = useRef<HTMLDivElement>(null);

  // Update currentTicket when ticket prop changes
  useEffect(() => {
    setCurrentTicket(ticket);
    setIsLoadingTicket(true);
    getTicketById(ticket.id)
      .then((live) => {
        const mapped = mapApiTicketToUiTicket(live, ticket.sourceSystemId);
        setCurrentTicket(mapped);
        onUpdate(mapped);
      })
      .catch((error) => setActionError(error?.message || 'Ticket details could not be refreshed.'))
      .finally(() => setIsLoadingTicket(false));
  }, [ticket.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'details') {
      scrollToBottom();
    }
  }, [currentTicket.messages, activeTab]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setActionError('');
    try {
      await updateTicketStatus(currentTicket.id, newStatus);
      const updated = { ...currentTicket, status: newStatus };
      setCurrentTicket(updated); onUpdate(updated);
    } catch (error: any) { setActionError(error?.message || 'Status could not be updated.'); }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    setActionError('');
    try {
      await updateTicket(currentTicket.id, { priority: newPriority });
      const updated = { ...currentTicket, priority: newPriority };
      setCurrentTicket(updated); onUpdate(updated);
    } catch (error: any) { setActionError(error?.message || 'Priority could not be updated.'); }
  };

  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleSendMessage = async () => {
    if (!replyText.trim() || isSendingMessage) return;
    
    setIsSendingMessage(true);
    try {
      // Send message to backend
      const result = await addMessageToTicket(ticket.id, replyText.trim());
      
      // Update ticket with new message and refreshed data
      if (result.ticket) {
        // Map backend messages to frontend format
        const mappedMessages: TicketMessage[] = (result.ticket.messages || []).map((msg: any) => ({
          id: msg.id,
          sender: msg.sender?.profile?.fullname || msg.sender?.email || 'Support',
          text: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        }));
        
        onUpdate({ 
          ...ticket, 
          messages: mappedMessages,
        });
      }
      
      setReplyText('');
      if (replyEditorRef.current) {
        replyEditorRef.current.innerHTML = '';
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeTicketWithAI(ticket);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const applyAiSuggestion = (suggestion: string) => {
    setReplyText(suggestion);
    if (replyEditorRef.current) {
      replyEditorRef.current.innerHTML = suggestion;
      replyEditorRef.current.focus();
    }
  };

  const formatReply = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (replyEditorRef.current) {
      setReplyText(replyEditorRef.current.innerHTML);
      replyEditorRef.current.focus();
    }
  };

  // Real history only. If the backend hasn't sent an activity log for this
  // ticket, the one entry we can honestly show is creation itself, derived
  // from the ticket's own real fields — not invented status/priority/
  // assignee events that may never have happened.
  const getHistory = (): TicketHistory[] => {
    if (ticket.history) return ticket.history;
    const sysName = getSystemDetails(ticket.sourceSystemId).name;
    return [
      {
        id: 'h-create',
        action: 'Ticket Created',
        user: ticket.user,
        timestamp: new Date(ticket.createdAt).toLocaleString(),
        details: `Ticket created via ${sysName}`
      },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 glass-modal-overlay transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl h-full bg-white/80 backdrop-blur-2xl shadow-2xl border-l border-white/50 animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-4 border-b border-white/30 bg-white/40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{currentTicket.ticketCode || currentTicket.id}</span>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {React.createElement(getSystemDetails(ticket.sourceSystemId).icon, { size: 14 })}
              {getSystemDetails(ticket.sourceSystemId).name}
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition"><X size={20}/></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20 bg-white/20 backdrop-blur-sm px-8 gap-6">
          <button 
            onClick={() => setActiveTab('details')} 
            className={`py-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'details' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <FileText size={16} /> Details & Chat
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`py-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'history' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <List size={16} /> History Log
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {actionError && <div className="absolute top-16 left-8 right-8 z-20 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 shadow">{actionError}</div>}
          {/* Main Content Switcher */}
          {activeTab === 'details' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">{currentTicket.subject}</h1>
                <div className="glass-panel !bg-white/40 p-5 rounded-2xl mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</h4>
                  <p className="text-gray-800 text-sm leading-relaxed font-medium">{currentTicket.description}</p>
                </div>

                {/* Disputed job evidence (VENDOR_APP_FLOW_SPEC.md Part 6):
                    the tagged maintenance record's photos/status/payment,
                    pulled directly - no re-uploads from the disputing party. */}
                {(currentTicket as any).maintenance ? (
                  <div className="glass-panel !bg-red-50/60 border border-red-100 p-5 rounded-2xl mb-6">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Disputed job</h4>
                    <p className="text-gray-800 text-sm font-medium">{(currentTicket as any).maintenance.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(currentTicket as any).maintenance.property?.name}
                      {(currentTicket as any).maintenance.property?.address ? ` · ${(currentTicket as any).maintenance.property.address}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold">
                      <span className="bg-white px-2 py-1 rounded-lg text-gray-700">Status: {(currentTicket as any).maintenance.status}</span>
                      <span className="bg-white px-2 py-1 rounded-lg text-gray-700">Payment: {(currentTicket as any).maintenance.paymentStatus}</span>
                      {(currentTicket as any).maintenance.amount ? (
                        <span className="bg-white px-2 py-1 rounded-lg text-gray-700">Amount: {(currentTicket as any).maintenance.amount}</span>
                      ) : null}
                      <span className="bg-white px-2 py-1 rounded-lg text-gray-700">
                        Confirmed by requester: {(currentTicket as any).maintenance.tenantVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {[...((currentTicket as any).maintenance.startAttachments ?? []), ...((currentTicket as any).maintenance.endAttachments ?? [])].length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[...((currentTicket as any).maintenance.startAttachments ?? []), ...((currentTicket as any).maintenance.endAttachments ?? [])].map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Job evidence ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-red-100" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">No before/after photos on this job.</p>
                    )}
                  </div>
                ) : null}
              </div>

              {/* AI Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Wand2 size={18} className="text-red-600" /> Asher AI Insights</h3>
                  {!aiAnalysis && (
                    <button onClick={runAIAnalysis} disabled={isAnalyzing} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-lg border border-red-100 font-bold hover:bg-red-100 transition flex items-center gap-2">
                      {isAnalyzing ? 'Analyzing...' : <><Wand2 size={12} /> Generate Summary</>}
                    </button>
                  )}
                </div>
                {isLoadingTicket && (
                  <div className="text-sm text-gray-500 italic">Loading ticket details...</div>
                )}
                {aiAnalysis && (
                  <div className="bg-gradient-to-br from-red-50/80 to-white/80 p-5 rounded-2xl border border-red-100 shadow-sm animate-in fade-in">
                    <div className="mb-4">
                       <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Summary</span>
                       <p className="text-sm font-medium text-gray-800 mt-1">{aiAnalysis.summary}</p>
                    </div>
                    <div>
                       <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Suggested Reply</span>
                       <div className="bg-white/60 p-3 rounded-xl border border-white/50 mt-1 text-sm text-gray-700 italic">
                          "{aiAnalysis.suggestion}"
                          <button onClick={() => applyAiSuggestion(aiAnalysis.suggestion)} className="ml-2 text-xs text-red-600 font-bold hover:underline not-italic">Use this</button>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="border-t border-gray-200/30 pt-6">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><History size={18} /> Activity Stream</h3>
                <div className="space-y-6 relative pl-4">
                  <div className="absolute left-[1.65rem] top-2 bottom-0 w-0.5 bg-gray-200/50"></div>
                  {currentTicket.messages && currentTicket.messages.length > 0 ? (
                    currentTicket.messages.map(msg => (
                    <div key={msg.id} className="relative flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${msg.sender === 'Support' ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {msg.sender === 'Support' ? 'A' : 'U'}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-bold text-gray-900">{msg.sender === 'Support' || msg.sender?.includes('Admin') ? 'Admin Support' : msg.sender || currentTicket.user}</span>
                            <span className="text-xs font-bold text-gray-400">{msg.timestamp}</span>
                         </div>
                         <div className="whitespace-pre-wrap bg-white/50 p-3 rounded-xl border border-white/50 shadow-sm text-sm text-gray-800 font-medium">{msg.text.replace(/<[^>]*>/g, '')}</div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No messages yet. Start the conversation below.</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced Rich Text Reply Box */}
                <div className="mt-6 bg-white/40 rounded-2xl border border-white/50 shadow-sm overflow-hidden flex flex-col">
                  <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0 absolute left-4 top-[calc(100%-50px)] hidden">A</div>
                  
                  {/* Formatting Toolbar */}
                  <div className="px-4 py-2 border-b border-white/20 bg-white/30 flex items-center gap-1">
                     <button onMouseDown={(e) => {e.preventDefault(); formatReply('bold')}} className="p-1.5 hover:bg-white/40 hover:text-red-600 rounded transition text-gray-500" title="Bold"><Bold size={16}/></button>
                     <button onMouseDown={(e) => {e.preventDefault(); formatReply('italic')}} className="p-1.5 hover:bg-white/40 hover:text-red-600 rounded transition text-gray-500" title="Italic"><Italic size={16}/></button>
                     <button onMouseDown={(e) => {e.preventDefault(); formatReply('underline')}} className="p-1.5 hover:bg-white/40 hover:text-red-600 rounded transition text-gray-500" title="Underline"><Underline size={16}/></button>
                     <div className="w-px h-4 bg-gray-300 mx-2"></div>
                     <button onMouseDown={(e) => {e.preventDefault(); formatReply('insertUnorderedList')}} className="p-1.5 hover:bg-white/40 hover:text-red-600 rounded transition text-gray-500" title="List"><List size={16}/></button>
                     <button onMouseDown={(e) => {e.preventDefault(); formatReply('insertOrderedList')}} className="p-1.5 hover:bg-white/40 hover:text-red-600 rounded transition text-gray-500" title="Numbered List"><ListOrdered size={16}/></button>
                     <div className="w-px h-4 bg-gray-300 mx-2"></div>
                     <button onMouseDown={(e) => {e.preventDefault(); formatReply('createLink', prompt('Enter URL') || '')}} className="p-1.5 hover:bg-white/40 hover:text-red-600 rounded transition text-gray-500" title="Link"><LinkIcon size={16}/></button>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 p-4 relative bg-white/20">
                    <div 
                       ref={replyEditorRef}
                       contentEditable
                       onInput={(e) => setReplyText(e.currentTarget.innerHTML)}
                       className="w-full outline-none text-sm text-gray-800 prose prose-sm prose-red max-w-none min-h-[120px]"
                       data-placeholder="Reply to customer..."
                    />
                  </div>

                  {/* Footer / Actions */}
                  <div className="flex justify-between items-center p-3 bg-white/10 border-t border-white/20">
                       <span className="text-xs text-gray-400">Replies are stored on this ticket only.</span>
                       <button 
                          onClick={handleSendMessage} 
                          disabled={!replyText.trim() || isSendingMessage} 
                          className="bg-gray-900 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black transition disabled:opacity-50 shadow-lg"
                       >
                          {isSendingMessage ? 'Sending...' : 'Send Reply'} <Send size={14}/>
                       </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* History Tab Content */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 animate-in fade-in">
               <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-gray-800 text-lg">Available Ticket History</h3></div>
               
               <div className="relative space-y-0 pl-2">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200/80"></div>
                  
                  {getHistory().map((item) => (
                     <div key={item.id} className="relative pl-12 pb-8 group last:pb-0">
                        {/* Timeline Dot */}
                        <div className="absolute left-[1.15rem] top-1 w-4 h-4 bg-white border-2 border-gray-300 rounded-full group-hover:border-red-500 group-hover:scale-110 transition-all z-10"></div>
                        
                        <div className="flex flex-col bg-white/40 border border-white/50 p-4 rounded-2xl shadow-sm group-hover:bg-white/60 transition-colors">
                           <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-gray-800 text-sm">{item.action}</span>
                              <span className="text-xs font-medium text-gray-400">{item.timestamp}</span>
                           </div>
                           <div className="text-xs text-gray-600 mb-2">
                              Performed by <span className="font-bold text-gray-700">{item.user}</span>
                           </div>
                           {item.details && (
                              <div className="bg-black/5 rounded-lg p-2 text-xs text-gray-600 font-medium font-mono border border-black/5">
                                 {item.details}
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {/* Right Sidebar (Context) */}
          <div className="w-80 bg-white/30 border-l border-white/40 p-6 space-y-8 overflow-y-auto backdrop-blur-sm">
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Status</label>
               <div className="relative">
                  <select value={currentTicket.status} onChange={(e) => handleStatusChange(e.target.value as TicketStatus)} className="w-full appearance-none bg-white/60 border border-white/60 rounded-xl px-4 py-2.5 font-bold text-sm text-gray-800 shadow-sm focus:ring-2 focus:ring-red-500 outline-none cursor-pointer">
                     {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Priority</label>
               <div className="flex flex-wrap gap-2">
                  {Object.values(TicketPriority).map(p => (
                     <button key={p} onClick={() => handlePriorityChange(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${currentTicket.priority === p ? getPriorityColor(p) + ' ring-1 ring-offset-1 ring-gray-300' : 'bg-white/40 text-gray-500 border-transparent hover:bg-white/60'}`}>
                        {p}
                     </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/30">
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Reporter</label>
                 <div className="flex items-center gap-2 p-2 bg-white/40 rounded-lg border border-white/40">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">{currentTicket.user.charAt(0)}</div>
                    <span className="text-sm font-bold text-gray-700">{currentTicket.user}</span>
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Created</label>
                 <span className="text-sm font-medium text-gray-600 flex items-center gap-2"><Clock size={14} /> {new Date(currentTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
