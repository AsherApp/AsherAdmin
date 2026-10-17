
import React from 'react';
import { UserProfile } from '../../types';
import { getSystemDetails } from '../../utils/uiHelpers';
import { PRESENCE_DOT, PRESENCE_LABEL, resolvePresence } from '../../utils/presence';
import { Avatar } from '../ui/Avatar';

interface UserTableProps {
  users: UserProfile[];
  onSelect: (user: UserProfile) => void;
  /** Busy access-request id while approve/reject is in flight. */
  accessWorkingId?: string | null;
  onApproveAccess?: (user: UserProfile) => void;
  onDeclineAccess?: (user: UserProfile) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onSelect,
  accessWorkingId = null,
  onApproveAccess,
  onDeclineAccess,
}) => {
  return (
    <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden">
      <div className="p-3 bg-white/20 border-b border-white/40 flex justify-between items-center backdrop-blur-sm">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3">Directory List</span>
        <span className="text-xs font-bold text-gray-500 bg-white/40 px-3 py-1 rounded-full">{users.length} Records Found</span>
      </div>

      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full min-w-[880px] text-left border-collapse">
          <thead className="bg-white/30 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr className="text-gray-500 text-xs border-b border-white/40">
              <th className="p-5 font-bold uppercase tracking-wider">User Identity</th>
              <th className="p-5 font-bold uppercase tracking-wider">System Access</th>
              <th className="p-5 font-bold uppercase tracking-wider">Status</th>
              <th className="p-5 font-bold uppercase tracking-wider">Last Active</th>
              <th className="p-5 font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const sysDetails = getSystemDetails(user.systemId);
              const SysIcon = sysDetails.icon;
              const isAccessRequest = user.status === 'Access Request' && Boolean(user.accessRequestId);
              const busy = accessWorkingId === user.accessRequestId;

              return (
                <tr
                  key={user.id}
                  onClick={() => {
                    if (!isAccessRequest) onSelect(user);
                  }}
                  className={`group border-b border-white/20 transition-all ${
                    isAccessRequest
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'hover:bg-white/40 cursor-pointer'
                  }`}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar
                        size="md"
                        name={user.name}
                        className="shadow-md transition-transform group-hover:scale-105"
                      />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                        {isAccessRequest && user.accessMessage ? (
                          <p className="mt-1 max-w-xs truncate text-[11px] text-amber-800/80">
                            “{user.accessMessage}”
                          </p>
                        ) : null}
                        {isAccessRequest ? (
                          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => onApproveAccess?.(user)}
                              className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
                            >
                              {busy ? 'Approving…' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => onDeclineAccess?.(user)}
                              className="cursor-pointer rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        ) : null}
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
                      user.status === 'Access Request' ? 'bg-amber-100/70 text-amber-800 border-amber-200/60' :
                      'bg-red-100/50 text-red-700 border-red-200/50'
                    }`}>
                      <span className={`w-2 h-2 rounded-full shadow-sm ${
                        user.status === 'Active' ? 'bg-green-500' :
                        user.status === 'Inactive' ? 'bg-gray-400' :
                        user.status === 'Pending Invite' ? 'bg-red-500' :
                        user.status === 'Access Request' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
                      {user.status === 'Pending Invite' || user.status === 'Suspended' || user.status === 'Access Request' ? (
                        <span>{user.lastActive}</span>
                      ) : (
                        <>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                PRESENCE_DOT[resolvePresence(user)],
                            }}
                          />
                          <span
                            style={{
                              color: PRESENCE_DOT[resolvePresence(user)],
                            }}
                          >
                            {user.lastActive || PRESENCE_LABEL[resolvePresence(user)]}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                    {isAccessRequest ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onApproveAccess?.(user)}
                          className="rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black disabled:opacity-50"
                        >
                          {busy ? '…' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDeclineAccess?.(user)}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">—</span>
                    )}
                  </td>
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
