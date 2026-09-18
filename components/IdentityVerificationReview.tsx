import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Loader, Check, X, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import {
  approveLandlordIdentity,
  getPendingIdentityVerifications,
  PendingIdentityVerification,
  rejectLandlordIdentity,
} from '../services/identityVerificationService';

function faceMatchCopy(
  match?: {
    matchScore: number;
    isMatch: boolean;
    reasoning?: string;
  } | null
) {
  if (!match || typeof match.matchScore !== 'number') {
    return 'Face match has not finished yet.';
  }
  const samePerson = match.isMatch && match.matchScore >= 70;
  const verdict = samePerson ? 'Looks like the same person' : 'Reviewer should look';
  const reason = match.reasoning ? ` — ${match.reasoning}` : '';
  return `${verdict} · ${Math.round(match.matchScore)}%${reason}`;
}

function stripeReady(item: PendingIdentityVerification) {
  return Boolean(item.stripeDetailsSubmitted && item.stripePayoutsEnabled);
}

const IdentityVerificationReview: React.FC = () => {
  const [items, setItems] = useState<PendingIdentityVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPendingIdentityVerifications();
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

  const handleApprove = async (landlordId: string) => {
    setActionId(landlordId);
    try {
      await approveLandlordIdentity(landlordId);
      setItems((prev) => prev.filter((item) => item.landlordId !== landlordId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to approve verification';
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (landlordId: string) => {
    if (!window.confirm('Reject this identity submission? The landlord will need to re-upload.')) {
      return;
    }
    setActionId(landlordId);
    try {
      await rejectLandlordIdentity(landlordId);
      setItems((prev) => prev.filter((item) => item.landlordId !== landlordId));
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
            Identity Verification
          </h2>
          <p className="text-gray-600 text-sm mt-1 font-medium">
            Review landlord ID uploads. Nigeria: Approve when documents look right —
            that unlocks leasing. UK: Stripe payouts must be ready before Approve.
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
          <p className="text-gray-600 font-medium">No pending identity verifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const uk = item.verifiedVia === 'stripe';
            const canApprove = !uk || stripeReady(item);
            return (
              <div
                key={item.landlordId}
                className="glass-panel p-5 rounded-2xl border border-white/50 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.email}</p>
                  {item.businessName && (
                    <p className="text-xs text-gray-500 mt-1">{item.businessName}</p>
                  )}
                  {item.submittedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {new Date(item.submittedAt).toLocaleString()}
                    </p>
                  )}
                  {uk ? (
                    <p className="text-xs font-bold mt-2">
                      {stripeReady(item) ? (
                        <span className="text-green-700">
                          Stripe: payouts ready — you can Approve
                        </span>
                      ) : item.stripeDetailsSubmitted ? (
                        <span className="text-amber-700">
                          Stripe: verifying — Approve unlocks when payouts are enabled
                        </span>
                      ) : (
                        <span className="text-blue-700">
                          Stripe: awaiting Connect / bank setup
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Nigeria / other — Asher reviews the ID. Approve unlocks leasing.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {item.livenessUrls?.map((url, index) => (
                      <a
                        key={`${item.landlordId}-selfie-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={url}
                          alt={`Selfie ${index + 1}`}
                          className="h-24 w-20 rounded-lg object-cover border border-emerald-100"
                        />
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          Selfie
                          <ExternalLink size={12} />
                        </span>
                      </a>
                    ))}
                    {item.documentUrls.map((url, index) => (
                      <a
                        key={`${item.landlordId}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded-lg h-fit"
                      >
                        Document {index + 1}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    {faceMatchCopy(item.faceMatch)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!canApprove ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 text-sm font-bold border border-amber-100">
                      <Clock size={16} />
                      Waiting on Stripe
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleApprove(item.landlordId)}
                      disabled={actionId === item.landlordId}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50"
                    >
                      {actionId === item.landlordId ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => void handleReject(item.landlordId)}
                    disabled={actionId === item.landlordId}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold disabled:opacity-50"
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IdentityVerificationReview;
