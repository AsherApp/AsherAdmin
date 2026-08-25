import React, { useState, useEffect } from 'react';
import { Search, Loader, X, ExternalLink, Trash2 } from 'lucide-react';
import UserTable from './users/UserTable';
import { getAllVendors, VendorUserProfile } from '../services/vendorService';
import { deleteLandlordAccount } from '../services/userService';

// Parallel to UserManagement.tsx's landlord listing, for the Vendor app
// (Part 1 of VENDOR_APP_FLOW_SPEC.md). Reuses the existing UserTable
// component since VendorUserProfile is a superset of UserProfile.
const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<VendorUserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await getAllVendors(1, 1000, searchTerm);
      setVendors(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: VendorUserProfile['verificationStatus']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Approved</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rejected</span>;
      case 'PENDING':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">No profile</span>;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Vendors</h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">
            {total} vendor account{total === 1 ? '' : 's'} across the platform.
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendors..."
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader className="animate-spin mr-2" />
          Loading vendors...
        </div>
      ) : (
        <UserTable users={vendors} onSelect={(u) => setSelectedVendor(u as VendorUserProfile)} />
      )}

      {selectedVendor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedVendor(null);
                setConfirmDelete(false);
                setDeleteError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800">{selectedVendor.name}</h3>
            <p className="text-sm text-gray-500">{selectedVendor.email}</p>
            <div className="mt-4">{statusBadge(selectedVendor.verificationStatus)}</div>

            {selectedVendor.businessName && (
              <p className="text-sm text-gray-600 mt-3">
                <span className="font-semibold">Business:</span> {selectedVendor.businessName}
                {selectedVendor.businessRegistrationNumber
                  ? ` (${selectedVendor.businessRegistrationNumber})`
                  : ''}
              </p>
            )}

            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Documents</p>
              {selectedVendor.documents.length === 0 ? (
                <p className="text-sm text-gray-400">No documents submitted.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded-lg"
                    >
                      {doc.type}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {deleteError && (
              <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{deleteError}</p>
            )}

            <button
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  setDeleteError('Click delete again to permanently remove this vendor.');
                  return;
                }
                setDeleting(true);
                setDeleteError('');
                try {
                  await deleteLandlordAccount(selectedVendor.id);
                  setVendors((current) => current.filter((v) => v.id !== selectedVendor.id));
                  setTotal((current) => Math.max(0, current - 1));
                  setSelectedVendor(null);
                  setConfirmDelete(false);
                } catch (err: any) {
                  setDeleteError(err?.message || 'Failed to delete vendor');
                  setConfirmDelete(false);
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleting ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
              {confirmDelete ? 'Click again to confirm delete' : 'Delete vendor'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
