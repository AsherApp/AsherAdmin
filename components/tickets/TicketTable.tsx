
import React from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../../types';
import { MessageSquare } from 'lucide-react';
import { getSystemDetails, getPriorityColor, getStatusColor } from '../../utils/uiHelpers';

interface TicketTableProps {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

const TicketTable: React.FC<TicketTableProps> = ({ tickets, onSelect }) => {
  return (
    <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/40 bg-white/30 shadow-xl animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr className="text-gray-500 text-xs border-b border-white/40">
              <th className="p-4 pl-6 font-bold uppercase tracking-wider w-32">Key</th>
              <th className="p-4 font-bold uppercase tracking-wider w-16">Source</th>
              <th className="p-4 font-bold uppercase tracking-wider">Subject & Summary</th>
              <th className="p-4 font-bold uppercase tracking-wider w-48">Reporter</th>
              <th className="p-4 font-bold uppercase tracking-wider w-32">Priority</th>
              <th className="p-4 font-bold uppercase tracking-wider w-32">Status</th>
              <th className="p-4 font-bold uppercase tracking-wider w-32">Created</th>
              <th className="p-4 font-bold uppercase tracking-wider w-32">Assignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  <p className="text-sm font-medium">No tickets found</p>
                  <p className="text-xs mt-1">Tickets will appear here when they are created</p>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
              const sys = getSystemDetails(ticket.sourceSystemId);
              const SysIcon = sys.icon;
              return (
                <tr 
                  key={ticket.id} 
                  onClick={() => onSelect(ticket)}
                  className="group hover:bg-white/60 transition-all cursor-pointer bg-white/10"
                >
                  <td className="p-4 pl-6">
                    <span className="font-mono font-bold text-xs text-gray-500 group-hover:text-red-600 transition-colors">{ticket.ticketCode || ticket.id}</span>
                  </td>
                  <td className="p-4">
                    <div className={`p-2 rounded-lg w-fit shadow-sm border border-black/5 ${sys.color}`}>
                      <SysIcon size={16} />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800 text-sm mb-0.5 group-hover:text-red-700 transition-colors">{ticket.subject}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 font-medium max-w-md">{ticket.description}</p>
                    {ticket.messages.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <MessageSquare size={10} />
                        {ticket.messages.length} updates
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                        {ticket.user.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{ticket.user}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-[10px] font-bold text-red-700">A</div>
                      <span className="text-xs font-bold text-gray-500">Admin</span>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketTable;
