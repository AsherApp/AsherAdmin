
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { Search, CheckCircle2, LayoutList, KanbanSquare, Plus, X, ArrowRight, Loader } from 'lucide-react';
import TicketTable from './tickets/TicketTable';
import TicketKanban from './tickets/TicketKanban';
import TicketDetailModal from './tickets/TicketDetailModal';
import {
  getAllTickets,
  updateTicketStatus,
  createTicket,
  mapApiTicketToUiTicket,
} from '../services/ticketService';

const TicketSystem: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  // Create Ticket State
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: TicketPriority.MEDIUM });

  useEffect(() => {
    loadTickets();
    // Refresh every 30 seconds
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllTickets(1, 100, searchQuery);
      if (!response.data || !Array.isArray(response.data)) {
        console.error('❌ TicketSystem: Invalid response data:', response);
        setTickets([]);
        return;
      }
      
      const mappedTickets = response.data.map((t) => mapApiTicketToUiTicket(t, '4'));
      setTickets(mappedTickets);
    } catch (error: any) {
      setError(error?.message || 'Tickets could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesStatus;
  });

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      critical: tickets.filter(t => t.priority === TicketPriority.HIGH && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length,
    };
  }, [tickets]);

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      await updateTicketStatus(id, status);
      await loadTickets(); // Refresh tickets
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) return;
    
    setIsCreatingTicket(true);
    try {
      await createTicket({
        subject: newTicket.subject,
        description: newTicket.description,
        type: 'SUPPORT',
        priority: newTicket.priority,
      });
      
      // Refresh tickets after creation
      await loadTickets();
      setIsCreating(false);
      setNewTicket({ subject: '', description: '', priority: TicketPriority.MEDIUM });
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Support Operations</h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">Support and dispute tracking across the Asher suite.</p>
        </div>
        <div className="flex gap-4 items-center">
          {loading ? (
            <div className="flex items-center gap-4">
              <Loader className="animate-spin text-red-600" size={24} />
            </div>
          ) : (
            <>
              <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
                <span className="text-2xl font-bold text-gray-800">{stats.open}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Open Issues</span>
              </div>
              <div className="glass-panel px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] border-red-100 bg-red-50/30">
                <span className="text-2xl font-bold text-red-600">{stats.critical}</span>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical</span>
              </div>
            </>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center gap-2 h-full"
          >
            <Plus size={20} /> Create Ticket
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error} <button onClick={() => void loadTickets()} className="ml-2 font-bold underline">Try again</button></div>}

      <div className="glass-panel p-4 rounded-3xl flex flex-wrap items-center gap-4 border border-white/40 bg-white/40 backdrop-blur-md">
         <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Search by ID, subject, or user..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 border border-white/60 focus:bg-white focus:shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-gray-800 font-medium" 
            />
         </div>
         
         <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            {viewMode === 'table' && (
               <label className="relative flex items-center gap-2 rounded-xl bg-white/50 px-3 border border-white/50"><CheckCircle2 size={16}/><span className="sr-only">Filter by status</span><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent py-2.5 text-sm font-bold outline-none"><option value="all">Any status</option>{Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></label>
            )}
            <div className="flex bg-white/50 p-1 rounded-xl border border-white/50">
               <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`} title="Table View"><LayoutList size={18}/></button>
               <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`} title="Kanban Board"><KanbanSquare size={18}/></button>
            </div>
         </div>
      </div>

      {viewMode === 'table' ? (
         <TicketTable tickets={filteredTickets} onSelect={setSelectedTicket} />
      ) : (
         <TicketKanban 
            tickets={filteredTickets} 
            onSelect={setSelectedTicket} 
            onStatusChange={handleStatusChange}
            draggedTicketId={draggedTicketId}
            setDraggedTicketId={setDraggedTicketId}
         />
      )}

      {selectedTicket && (
         <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdate={handleUpdateTicket} />
      )}

      {/* Create Ticket Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 glass-modal-overlay transition-opacity" onClick={() => setIsCreating(false)}></div>
           <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-white/10"
             style={{ background: 'rgba(255, 255, 255, 0.40)', backdropFilter: 'blur(40px) saturate(150%)' }}
           >
              <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/10 backdrop-blur-md">
                 <h3 className="font-bold text-xl text-gray-800">Create New Ticket</h3>
                 <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-red-600 transition"><X size={24}/></button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Subject</label>
                    <input 
                      type="text" 
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                      className="glass-input w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white/30 placeholder-gray-400" 
                      placeholder="Brief summary of the issue..." 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
                    <textarea 
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                      className="glass-input w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white/30 placeholder-gray-400 min-h-[100px] resize-none" 
                      placeholder="Detailed explanation..." 
                    />
                 </div>
                 <div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
                       <select 
                          value={newTicket.priority} 
                          onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as TicketPriority})}
                          className="glass-input w-full p-3 rounded-xl text-sm font-medium appearance-none bg-white/30 cursor-pointer"
                       >
                          {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-white/10 border-t border-white/20 flex justify-end gap-3 backdrop-blur-md">
                 <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-white/30 rounded-xl transition">Cancel</button>
                 <button onClick={handleCreateTicket} className="px-6 py-2 bg-red-600/90 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg flex items-center gap-2">
                    Create Ticket <ArrowRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TicketSystem;
