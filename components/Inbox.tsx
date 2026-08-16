import React, { useState, useEffect, useRef } from 'react';
import { ChatThread, ChatMessage } from '../types';
import { Search, Send, Paperclip, Monitor, Wand2, Loader } from 'lucide-react';
import { generateSmartReplies } from '../services/geminiService';
import { getChatRooms, getChatMessages, getChatRoomMessages, sendMessage, ChatRoom, ChatMessage as ApiChatMessage } from '../services/chatService';
import { getCurrentUser } from '../services/authService';

const Inbox: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const attachmentRef = useRef<HTMLInputElement>(null);
  const currentUserId = getCurrentUser()?.id;

  const activeThread = threads.find(t => t.id === activeThreadId);

  useEffect(() => {
    loadChatRooms();
    // Refresh every 30 seconds
    const interval = setInterval(loadChatRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeThreadId && threads.length > 0) {
      const thread = threads.find(t => t.id === activeThreadId);
      if (thread && thread.messages.length === 0) {
        loadChatMessages(activeThreadId);
      }
    }
  }, [activeThreadId, threads.length]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const chatRooms = await getChatRooms();
      
      setError('');
      const mappedThreads: ChatThread[] = chatRooms.map((room: ChatRoom) => {
        // Get both users to show the conversation
        const user1 = room.user1;
        const user2 = room.user2;
        
        // Show both users in conversation name for admin view
        const user1Name = user1?.profile?.fullname || 
                         (user1?.profile?.firstName && user1?.profile?.lastName 
                           ? `${user1.profile.firstName} ${user1.profile.lastName}`.trim()
                           : user1?.email?.split('@')[0] || 'User 1');
        const user2Name = user2?.profile?.fullname || 
                         (user2?.profile?.firstName && user2?.profile?.lastName 
                           ? `${user2.profile.firstName} ${user2.profile.lastName}`.trim()
                           : user2?.email?.split('@')[0] || 'User 2');
        
        const displayUser = room.user1Id === currentUserId ? user2 : user1;
        const userName = room.user1Id === currentUserId ? user2Name : user1Name;
        
        // Get last message from room messages if available
        const lastMessage = room.messages && room.messages.length > 0 
          ? room.messages[0] 
          : null;
        
        return {
          id: room.id,
          userId: displayUser?.id || user1?.id || '',
          userName: userName,
          systemId: '4', // Rent Mgmt System
          lastMessage: lastMessage?.content || 'No messages yet',
          lastMessageTime: lastMessage 
            ? new Date(lastMessage.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : 'No messages',
          unreadCount: 0, // TODO: Implement unread count
          messages: [],
        };
      });
      
      setThreads((previous) => mappedThreads.map((thread) => ({ ...thread, messages: previous.find((item) => item.id === thread.id)?.messages || [] })));
      if (mappedThreads.length > 0 && !activeThreadId) {
        setActiveThreadId(mappedThreads[0].id);
      }
      if (activeThreadId) void loadChatMessages(activeThreadId);
    } catch (error: any) {
      setError(error?.message || 'Admin conversations could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatRoomId: string) => {
    try {
      // Use chatRoomId to get messages
      const messages = await getChatRoomMessages(chatRoomId);
      const mappedMessages: ChatMessage[] = messages.map((msg: ApiChatMessage) => {
        // Determine if message is from admin (me) or other user
        const isFromMe = msg.senderId === currentUserId;
        
        return {
          id: msg.id,
          senderId: isFromMe ? 'me' : msg.senderId,
          text: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
      });
      
      // Update thread with messages
      setThreads(prevThreads =>
        prevThreads.map(t =>
          t.id === chatRoomId ? { ...t, messages: mappedMessages } : t
        )
      );
    } catch (error) {
      console.error('Error loading chat messages:', error);
      // Fallback: try to get messages from the thread's userId
      const thread = threads.find(t => t.id === chatRoomId);
      if (thread) {
        try {
          const messages = await getChatMessages(thread.userId);
          const mappedMessages: ChatMessage[] = messages.map((msg: ApiChatMessage) => {
            const isFromMe = msg.senderId === currentUserId;
            
            return {
              id: msg.id,
              senderId: isFromMe ? 'me' : msg.senderId,
              text: msg.content,
              timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            };
          });
          
          setThreads(prevThreads =>
            prevThreads.map(t =>
              t.id === chatRoomId ? { ...t, messages: mappedMessages } : t
            )
          );
        } catch (fallbackError) {
          console.error('Error loading chat messages (fallback):', fallbackError);
        }
      }
    }
  };

  // Fetch Smart Replies when active thread changes
  useEffect(() => {
    const fetchReplies = async () => {
      if (!activeThread || activeThread.messages.length === 0) {
        setSmartReplies([]);
        return;
      }
      setIsGeneratingReplies(true);
      const replies = await generateSmartReplies(activeThread);
      setSmartReplies(replies);
      setIsGeneratingReplies(false);
    };
    fetchReplies();
  }, [activeThreadId, activeThread?.messages.length]);

  const handleSendMessage = async (text: string = newMessage) => {
    if (!text.trim() || !activeThread) return;
    
    setSending(true);
    try {
      const result = await sendMessage(activeThread.userId, text);
      
      // Add message to thread
      const newMsg: ChatMessage = {
        id: result.message.id,
        senderId: result.message.senderId,
        text: result.message.content,
        timestamp: new Date(result.message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };

      setThreads(prevThreads =>
        prevThreads.map(t =>
          t.id === activeThreadId
            ? {
                ...t,
                messages: [...t.messages, newMsg],
                lastMessage: text,
                lastMessageTime: 'Just now',
              }
            : t
        )
      );
      
      setNewMessage('');
      setSmartReplies([]);
    } catch (error: any) {
      setError(error?.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async (file?: File) => {
    if (!file || !activeThread) return;
    setSending(true); setError('');
    try {
      await sendMessage(activeThread.userId, newMessage.trim() || `Attachment: ${file.name}`, [file]);
      setNewMessage('');
      await loadChatMessages(activeThread.id);
    } catch (error: any) { setError(error?.message || 'Attachment could not be sent.'); }
    finally { setSending(false); if (attachmentRef.current) attachmentRef.current.value = ''; }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden relative">
      {error && <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800 shadow">{error}</div>}
      {/* Sidebar List */}
      <div className="w-80 flex flex-col glass-panel rounded-3xl border border-white/40">
        <div className="p-5 border-b border-white/40 bg-white/20 backdrop-blur-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 tracking-tight">Admin Chat</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium placeholder-gray-400"/>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="animate-spin text-red-600" size={32} />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Monitor size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-sm">No conversations yet</p>
            </div>
          ) : (
            threads.filter((thread) => `${thread.userName} ${thread.lastMessage}`.toLowerCase().includes(search.toLowerCase())).map(thread => (
            <div key={thread.id} onClick={() => setActiveThreadId(thread.id)} className={`p-5 border-b border-white/20 cursor-pointer transition-all hover:bg-white/40 ${activeThreadId === thread.id ? 'bg-red-50/60 border-l-4 border-l-red-600 backdrop-blur-sm' : 'border-l-4 border-l-transparent'}`}>
              <div className="flex justify-between mb-1.5">
                <span className={`font-bold text-sm ${activeThreadId === thread.id ? 'text-red-700' : 'text-gray-800'}`}>{thread.userName}</span>
                <span className="text-[10px] font-bold text-gray-400">{thread.lastMessageTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-xs truncate max-w-[180px] font-medium ${activeThreadId === thread.id ? 'text-gray-600' : 'text-gray-500'}`}>{thread.lastMessage}</p>
                {thread.unreadCount > 0 && <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md shadow-red-500/30">{thread.unreadCount}</span>}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative">
        {activeThread ? (
          <>
            <div className="p-5 border-b border-white/40 flex justify-between items-center bg-white/30 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white/50 flex items-center justify-center font-bold text-gray-600 shadow-inner border border-white/50 text-lg">{activeThread.userName.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{activeThread.userName}</h3>
                  <div className="text-xs text-gray-500 font-medium">Admin-participant conversation</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/10 custom-scrollbar">
              {activeThread.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[70%] px-6 py-4 rounded-2xl shadow-md backdrop-blur-md border border-white/40 ${msg.senderId === 'me' ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-br-none shadow-red-500/20' : 'bg-white/80 text-gray-800 rounded-bl-none'}`}>
                      <p className="text-sm font-medium">{msg.text}</p>
                      <span className={`text-[10px] block mt-2 text-right font-bold ${msg.senderId === 'me' ? 'text-red-100/80' : 'text-gray-400'}`}>{msg.timestamp}</span>
                   </div>
                </div>
              ))}
            </div>

            {/* Smart Replies & Input */}
            <div className="p-5 bg-white/30 backdrop-blur-md border-t border-white/40">
              {/* Smart Replies Chips */}
              {smartReplies.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 animate-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-1 text-xs font-bold text-red-600 mr-2"><Wand2 size={12}/> AI Suggestions:</div>
                   {smartReplies.map((reply, idx) => (
                     <button 
                        key={idx}
                        onClick={() => handleSendMessage(reply)}
                        className="whitespace-nowrap px-3 py-1.5 bg-white/60 hover:bg-red-50 hover:text-red-700 border border-white/60 rounded-full text-xs font-medium text-gray-600 transition shadow-sm"
                     >
                        {reply}
                     </button>
                   ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input ref={attachmentRef} type="file" className="hidden" onChange={(e) => void handleAttachment(e.target.files?.[0])} />
                <button onClick={() => attachmentRef.current?.click()} disabled={sending} aria-label="Attach file" className="p-3 text-gray-500 hover:text-red-600 hover:bg-white/50 rounded-xl transition disabled:opacity-50"><Paperclip size={20} /></button>
                <div className="flex-1 relative">
                   <input 
                    type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..." className="glass-input w-full pl-5 pr-10 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium text-sm"
                   />
                </div>
                <button 
                  onClick={() => handleSendMessage()} 
                  className="p-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-lg hover:shadow-red-500/40 disabled:opacity-50 disabled:shadow-none transform active:scale-95" 
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 border border-white/30 shadow-lg backdrop-blur-sm"><Monitor size={48} className="text-gray-300" /></div>
            <p className="font-bold text-lg text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
