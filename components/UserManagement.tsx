
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile } from '../types';
import { Search, UserPlus, Filter, Loader } from 'lucide-react';
import UserTable from './users/UserTable';
import AddUserModal from './users/AddUserModal';
import UserDetailModal from './users/UserDetailModal';
import { getAllLandlords } from '../services/userService';
import {
  LandlordAccessRequest,
  approveLandlordAccessRequest,
  getLandlordAccessRequests,
  rejectLandlordAccessRequest,
} from '../services/adminService';

const requestToDirectoryRow = (request: LandlordAccessRequest): UserProfile => {
  const name = [request.firstName, request.lastName].filter(Boolean).join(' ').trim();
  return {
    id: `access-req-${request.id}`,
    name: name || request.email,
    email: request.email,
    role: 'Landlord',
    systemId: '4',
    status: 'Access Request',
    lastActive: request.createdAt
      ? `Requested ${new Date(request.createdAt).toLocaleDateString()}`
      : 'Requested access',
    phone: request.phoneNumber || undefined,
    accessRequestId: request.id,
    accessMessage: request.message,
  };
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [accessRequests, setAccessRequests] = useState<LandlordAccessRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [accessWorkingId, setAccessWorkingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{
    row: UserProfile;
    action: 'approve' | 'decline';
  } | null>(null);
  const [declineNote, setDeclineNote] = useState('');

  const loadDirectory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [landlordsResponse, pendingRequests] = await Promise.all([
        getAllLandlords(1, 1000, searchTerm),
        getLandlordAccessRequests('PENDING').catch(() => [] as LandlordAccessRequest[]),
      ]);
      setUsers(landlordsResponse.data || []);
      setTotal(landlordsResponse.total || 0);
      setAccessRequests(pendingRequests || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
      setTotal(0);
      setAccessRequests([]);
      setError('Could not load directory.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  const directoryRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    // If they're already in the directory (invited/active), never show Accept again.
    const landlordEmails = new Set(
      users.map((u) => u.email.trim().toLowerCase()).filter(Boolean)
    );

    const requestRows = accessRequests
      .filter((r) => !landlordEmails.has(r.email.trim().toLowerCase()))
      .map(requestToDirectoryRow)
      .filter((row) => {
        if (!q) return true;
        return (
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          (row.phone || '').toLowerCase().includes(q)
        );
      });

    const landlordRows = users.filter((u) => statusFilter === 'all' || u.status === statusFilter);

    // Access requests sit at the top so Accept/Decline is obvious.
    const showRequests = statusFilter === 'all' || statusFilter === 'Access Request';
    return [...(showRequests ? requestRows : []), ...landlordRows];
  }, [accessRequests, users, statusFilter, searchTerm]);

  const handleAddUser = (newUser: UserProfile) => {
    setUsers([newUser, ...users]);
    setTotal(total + 1);
  };

  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    if (!selectedUser) return;
    const updatedUser = { ...selectedUser, ...updatedData };
    setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setSelectedUser(null);
  };

  const handleApproveAccess = async (row: UserProfile) => {
    if (!row.accessRequestId) return;
    await confirmApproveAccess(row);
  };

  const confirmApproveAccess = async (row: UserProfile) => {
    if (!row.accessRequestId) return;
    setAccessWorkingId(row.accessRequestId);
    setNotice(null);
    setFallbackLink(null);
    setError(null);
    try {
      const result: any = await approveLandlordAccessRequest(row.accessRequestId);
      const payload = result?.data?.data ?? result?.data ?? result;
      const alreadyExisted = payload?.alreadyExisted === true;
      const emailFailed = payload?.emailSent === false && !alreadyExisted;
      setFallbackLink(emailFailed ? payload?.invitationLink ?? null : null);
      setNotice(
        alreadyExisted
          ? `${row.email} already has a landlord account — cleared from the approval queue.`
          : emailFailed
            ? `Approved ${row.email}, but the invitation email did not send — copy the link below.`
            : `Approved ${row.email}. Invitation sent; they now show as Pending Invite.`
      );
      await loadDirectory();
    } catch (err: any) {
      setError(err?.message || `Could not approve ${row.email}.`);
    } finally {
      setAccessWorkingId(null);
      setPendingDecision(null);
    }
  };

  const handleDeclineAccess = async (row: UserProfile) => {
    if (!row.accessRequestId) return;
    setPendingDecision({ row, action: 'decline' });
    setDeclineNote('');
  };

  const confirmDeclineAccess = async (row: UserProfile) => {
    if (!row.accessRequestId) return;
    const note = declineNote.trim();
    setAccessWorkingId(row.accessRequestId);
    setNotice(null);
    setFallbackLink(null);
    setError(null);
    try {
      await rejectLandlordAccessRequest(row.accessRequestId, note || undefined);
      setNotice(`Declined ${row.email}.`);
      await loadDirectory();
    } catch {
      setError(`Could not decline ${row.email}.`);
    } finally {
      setAccessWorkingId(null);
      setPendingDecision(null);
    }
  };

  const pendingAccessCount = accessRequests.length;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">User Directory</h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">
            Invite landlords, review access requests, and manage profiles — same list.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-red-600/90 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {pendingAccessCount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-bold">{pendingAccessCount}</span> access request
          {pendingAccessCount === 1 ? '' : 's'} waiting — Accept or Decline on the rows highlighted below.
        </div>
      ) : null}

      {pendingDecision ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-800 shadow-xl">
          <p className="font-bold">
            {pendingDecision.action === 'approve'
              ? `Approve ${pendingDecision.row.email} and send their landlord invitation?`
              : `Decline ${pendingDecision.row.email}?`}
          </p>
          {pendingDecision.action === 'decline' ? (
            <textarea
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Optional note for your records"
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          ) : (
            <p className="mt-1 text-gray-600">
              They will get a link to set a password and sign in.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={Boolean(accessWorkingId)}
              onClick={() =>
                void (pendingDecision.action === 'approve'
                  ? confirmApproveAccess(pendingDecision.row)
                  : confirmDeclineAccess(pendingDecision.row))
              }
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {accessWorkingId
                ? 'Saving…'
                : pendingDecision.action === 'approve'
                  ? 'Send invitation'
                  : 'Decline request'}
            </button>
            <button
              type="button"
              disabled={Boolean(accessWorkingId)}
              onClick={() => setPendingDecision(null)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      ) : null}
      {fallbackLink ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="mb-2 font-medium">Set-password link (email failed)</p>
          <code className="block break-all rounded bg-white px-2 py-1 text-xs">{fallbackLink}</code>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(fallbackLink)}
            className="mt-2 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white"
          >
            Copy link
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void loadDirectory();
                }
              }}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" 
            />
         </div>
         <div className="relative w-72">
            <div className="absolute left-4 top-3 text-gray-500 pointer-events-none"><Filter size={20} /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer text-gray-700 font-medium">
              <option value="all">All landlords</option>
              <option value="Active">Active</option>
              <option value="Pending Invite">Waiting to join</option>
              <option value="Suspended">Suspended</option>
              <option value="Access Request">Asked to join</option>
            </select>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-red-600" size={32} />
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-2">
            Showing {directoryRows.length} rows
            {pendingAccessCount > 0 ? ` · ${pendingAccessCount} access request${pendingAccessCount === 1 ? '' : 's'}` : ''}
            {total ? ` · ${total} invited/active landlords` : ''}
          </div>
          <UserTable
            users={directoryRows}
            onSelect={setSelectedUser}
            accessWorkingId={accessWorkingId}
            onApproveAccess={(row) => void handleApproveAccess(row)}
            onDeclineAccess={(row) => void handleDeclineAccess(row)}
          />
        </>
      )}

      {selectedUser && selectedUser.status !== 'Access Request' && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />
      )}

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onAdd={handleAddUser} />
      )}
    </div>
  );
};

export default UserManagement;
