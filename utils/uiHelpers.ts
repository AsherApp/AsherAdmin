
import React from 'react';
import { Smartphone, Globe, Server, AlertCircle } from 'lucide-react';
import { TicketPriority, TicketStatus, SystemStatus } from '../types';

export const getSystemDetails = (id: string) => {
  switch(id) {
    case '1': return { name: 'Tenant Portal', shortName: 'Tenant Portal', icon: Smartphone, color: 'text-purple-600 bg-purple-100', url: '' };
    case '2': return { name: 'Vendor App', shortName: 'Vendor App', icon: Smartphone, color: 'text-blue-600 bg-blue-100', url: '' };
    case '3': return { name: 'Listing Web', shortName: 'Listing Web', icon: Globe, color: 'text-green-600 bg-green-100', url: '' };
    case '4': return {
      name: 'Rent Mgmt System',
      shortName: 'Rent Mgmt',
      icon: Server,
      color: 'text-orange-600 bg-orange-100',
      url: 'https://asherlanlord.vercel.app',
    };
    case '5': return { name: 'Admin Dash', shortName: 'Admin', icon: Server, color: 'text-gray-600 bg-gray-100', url: '' };
    default: return { name: 'Unknown', shortName: 'Unknown', icon: AlertCircle, color: 'text-gray-400 bg-gray-100', url: '' };
  }
};

export const getPriorityColor = (p: TicketPriority) => {
  switch(p) {
    case TicketPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
    case TicketPriority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200';
    case TicketPriority.LOW: return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100';
  }
};

export const getStatusColor = (s: TicketStatus) => {
  switch(s) {
    case TicketStatus.OPEN: return 'bg-blue-100 text-blue-700 border-blue-200';
    case TicketStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700 border-amber-200';
    case TicketStatus.RESOLVED: return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100';
  }
};

