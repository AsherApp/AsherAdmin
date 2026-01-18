
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Search, UserPlus, Filter, Loader } from 'lucide-react';
import { getSystemDetails } from '../utils/uiHelpers';
import UserTable from './users/UserTable';
import AddUserModal from './users/AddUserModal';
import UserDetailModal from './users/UserDetailModal';
import { getAllLandlords } from '../services/userService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystem, setFilterSystem] = useState('4'); // Default to Rent Mgmt System
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, filterSystem]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Fetch all users (increased limit to get all landlords)
      const response = await getAllLandlords(1, 1000, searchTerm);
      setUsers(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSystem = filterSystem === 'all' || u.systemId === filterSystem;
    return matchesSystem;
  });

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

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">User Directory</h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">Manage access and profiles across the ecosystem.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-red-600/90 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <UserPlus size={18} /> Add User
        </button>
      </div>

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
                  loadUsers();
                }
              }}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" 
            />
         </div>
         <div className="relative w-72">
            <div className="absolute left-4 top-3 text-gray-500 pointer-events-none"><Filter size={20} /></div>
            <select value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)} className="glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer text-gray-700 font-medium">
              <option value="all">All Systems</option>
              <option value="4">Rent Mgmt System</option>
              <option value="1">Tenant Portal</option>
              <option value="2">Vendor App</option>
              <option value="3">Listing Website</option>
              <option value="5">Admin</option>
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
            Showing {filteredUsers.length} of {total} users
          </div>
          <UserTable users={filteredUsers} onSelect={setSelectedUser} />
        </>
      )}

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />
      )}

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onAdd={handleAddUser} />
      )}
    </div>
  );
};

export default UserManagement;
