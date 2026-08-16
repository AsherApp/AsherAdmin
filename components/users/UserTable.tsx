
import React from 'react';
import { UserProfile } from '../../types';
import { getSystemDetails } from '../../utils/uiHelpers';

interface UserTableProps {
  users: UserProfile[];
  onSelect: (user: UserProfile) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onSelect }) => {
  return (
    <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden">
      <div className="p-3 bg-white/20 border-b border-white/40 flex justify-between items-center backdrop-blur-sm">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3">Directory List</span>
        <span className="text-xs font-bold text-gray-500 bg-white/40 px-3 py-1 rounded-full">{users.length} Records Found</span>
      </div>

      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/30 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr className="text-gray-500 text-xs border-b border-white/40">
              <th className="p-5 font-bold uppercase tracking-wider">User Identity</th>
              <th className="p-5 font-bold uppercase tracking-wider">System Access</th>
              <th className="p-5 font-bold uppercase tracking-wider">Status</th>
              <th className="p-5 font-bold uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const sysDetails = getSystemDetails(user.systemId);
              const SysIcon = sysDetails.icon;
              return (
                <tr key={user.id} onClick={() => onSelect(user)} className="group border-b border-white/20 hover:bg-white/40 transition-all cursor-pointer">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full glass-panel flex items-center justify-center font-bold text-gray-600 text-lg shadow-md group-hover:scale-105 transition-transform">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[10px] font-bold text-gray-600 border border-white/60 px-2 py-0.5 rounded bg-white/40 uppercase tracking-wide">{user.role}</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <SysIcon size={14} />
                        <span>{sysDetails.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex w-fit items-center gap-2 border backdrop-blur-sm ${
                      user.status === 'Active' ? 'bg-green-100/50 text-green-700 border-green-200/50' :
                      user.status === 'Inactive' ? 'bg-gray-100/50 text-gray-600 border-gray-200/50' :
                      user.status === 'Pending Invite' ? 'bg-red-100/50 text-red-700 border-red-200/50' :
                      'bg-red-100/50 text-red-700 border-red-200/50'
                    }`}>
                      <span className={`w-2 h-2 rounded-full shadow-sm ${
                        user.status === 'Active' ? 'bg-green-500' :
                        user.status === 'Inactive' ? 'bg-gray-400' :
                        user.status === 'Pending Invite' ? 'bg-red-500' :
                        'bg-red-500'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-gray-500 font-mono">{user.lastActive}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
