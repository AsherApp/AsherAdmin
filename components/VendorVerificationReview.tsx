import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Loader, Check, X, ExternalLink, RefreshCw } from 'lucide-react';
import {
  approveVendorVerification,
  getPendingVendorVerifications,
  PendingVendorVerification,
  rejectVendorVerification,
} from '../services/vendorService';

// Mirrors IdentityVerificationReview.tsx (landlord identity review) for
// vendor onboarding (Part 1 of VENDOR_APP_FLOW_SPEC.md) - a vendor cannot
// access the Vendor app dashboard until reviewed here.
const VendorVerificationReview: React.FC = () => {
  const [items, setItems] = useState<PendingVendorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingVendorVerifications();
      setItems(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load pending verifications';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const handleApprove = async (vendorId: string) => {
    setActionId(vendorId);
    try {
      await approveVendorVerification(vendorId);
      setItems((prev) => prev.filter((item) => item.vendorId !== vendorId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to approve verification';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (vendorId: string) => {
    if (!window.confirm('Reject this vendor submission? They will need to restart onboarding.')) {
      return;
    }
    setActionId(vendorId);
    try {
      await rejectVendorVerification(vendorId);
      setItems((prev) => prev.filter((item) => item.vendorId !== vendorId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to reject verification';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-red-600" />
            Vendor Verification
          </h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">
            Review vendor ID, certification, and selfie uploads before the Vendor app unlocks.
          </p>
        </div>
        <button
          onClick={() => void loadPending()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white/70 hover:bg-white text-sm font-bold text-gray-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader className="animate-spin mr-2" />
          Loading pending reviews...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/50">
          <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium">No pending vendor verifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.vendorId}
              className="glass-panel p-5 rounded-2xl border border-white/50 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.email}</p>
                {item.businessName && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.businessName}
                    {item.businessRegistrationNumber ? ` · ${item.businessRegistrationNumber}` : ''}
                  </p>
                )}
                {item.submittedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Updated {new Date(item.submittedAt).toLocaleString()}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.documents.map((doc) => (
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
                  {item.documents.length === 0 && (
                    <span className="text-xs text-gray-400">No documents submitted</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => void handleApprove(item.vendorId)}
                  disabled={actionId === item.vendorId}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {actionId === item.vendorId ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => void handleReject(item.vendorId)}
                  disabled={actionId === item.vendorId}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold disabled:opacity-50"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorVerificationReview;
