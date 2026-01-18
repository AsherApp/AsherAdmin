
import React from 'react';
import { Ticket, TicketStatus } from '../../types';
import { Clock, GripHorizontal } from 'lucide-react';
import { getSystemDetails, getPriorityColor } from '../../utils/uiHelpers';

interface TicketKanbanProps {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
  onStatusChange: (id: string, status: TicketStatus) => void;
  draggedTicketId: string | null;
  setDraggedTicketId: (id: string | null) => void;
}

const TicketKanban: React.FC<TicketKanbanProps> = ({ tickets, onSelect, onStatusChange, draggedTicketId, setDraggedTicketId }) => {
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTicketId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: TicketStatus) => {
    e.preventDefault();
    if (draggedTicketId) {
      onStatusChange(draggedTicketId, newStatus);
      setDraggedTicketId(null);
    }
  };

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 animate-in fade-in duration-300">
      {Object.values(TicketStatus).map((status) => {
        const columnTickets = tickets.filter(t => t.status === status);
        return (
          <div 
            key={status}
            className="w-[350px] flex-shrink-0 glass-panel rounded-3xl flex flex-col border border-white/40 bg-white/20 backdrop-blur-md"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="p-4 border-b border-white/30 flex items-center justify-between bg-white/10 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  status === TicketStatus.OPEN ? 'bg-blue-500' :
                  status === TicketStatus.IN_PROGRESS ? 'bg-amber-500' : 'bg-green-500'
                }`}></div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{status}</h3>
              </div>
              <span className="text-xs font-bold bg-white/40 text-gray-600 px-2 py-1 rounded-lg">{columnTickets.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-white/5 min-h-[200px]">
              {columnTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-xs font-medium">No tickets in this status</p>
                </div>
              ) : (
                columnTickets.map(ticket => {
                const sys = getSystemDetails(ticket.sourceSystemId);
                const SysIcon = sys.icon;
                return (
                  <div 
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onClick={() => onSelect(ticket)}
                    className={`glass-panel !bg-white/60 p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-grab active:cursor-grabbing border border-white/60 group ${draggedTicketId === ticket.id ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] font-bold text-gray-400 bg-white/50 px-1.5 py-0.5 rounded border border-white/50">{ticket.ticketCode || ticket.id}</span>
                      <div className="cursor-grab text-gray-300 hover:text-gray-500"><GripHorizontal size={14} /></div>
                    </div>
                    
                    <h4 className="font-bold text-sm text-gray-800 mb-2 line-clamp-2 leading-snug group-hover:text-red-700 transition-colors">{ticket.subject}</h4>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${sys.color} border-opacity-20`}>
                        <SysIcon size={10} />
                        <span className="truncate max-w-[80px]">{sys.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                          {ticket.user.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-gray-500 truncate max-w-[100px]">{ticket.user}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketKanban;
