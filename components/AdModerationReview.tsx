import React, { useCallback, useEffect, useState } from 'react';
import { Check, Clock, Loader, RefreshCw, Store, Tag, X } from 'lucide-react';
import {
  getAdsForModeration,
  ModeratedAd,
  reviewAd,
} from '../services/adModerationService';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Awaiting review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function money(value?: string | number | null, currency?: string | null) {
  if (value == null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency ?? ''} ${amount}`.trim();
  }
}

const AdModerationReview: React.FC = () => {
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [items, setItems] = useState<ModeratedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // A rejection has to say why, so the seller knows what to fix.
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getAdsForModeration(status);
      setItems(page.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load listings');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (ad: ModeratedAd, decision: 'APPROVED' | 'REJECTED') => {
    const reason = reasons[ad.id]?.trim();
    if (decision === 'REJECTED' && !reason) {
      setError('Add a reason before rejecting, so the seller knows what to fix.');
      return;
    }
    setActionId(ad.id);
    setError('');
    try {
      await reviewAd(ad.id, decision, reason);
      setItems((prev) => prev.filter((entry) => entry.id !== ad.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save that decision');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Marketplace moderation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tenant listings wait here until you approve them. Platform Pricing is only the rates.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === filter.value
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="h-4 w-4 animate-spin" /> Loading listings…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/60 p-12 text-center">
          <Clock className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-700">Nothing here</p>
          <p className="mt-1 text-sm text-gray-500">
            {status === 'PENDING'
              ? 'Every listing has been reviewed.'
              : 'No listings with this status.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((ad) => {
            const isItem = ad.listingType !== 'BUSINESS';
            const price = money(ad.price, ad.currency);
            const busy = actionId === ad.id;

            return (
              <article
                key={ad.id}
                className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl shadow-red-500/5 backdrop-blur"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {ad.attachment?.[0] ? (
                    <img
                      src={ad.attachment[0]}
                      alt=""
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-100 text-gray-300">
                      {isItem ? <Tag className="h-7 w-7" /> : <Store className="h-7 w-7" />}
                    </div>
                  )}

                  <div className="min-w-[16rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          isItem ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isItem ? 'ITEM' : 'BUSINESS'}
                      </span>
                      {ad.category ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          {ad.category}
                        </span>
                      ) : null}
                      {ad.condition ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          {ad.condition}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-gray-800">{ad.title}</h3>
                    {price ? (
                      <p className="text-base font-bold text-red-600">{price}</p>
                    ) : isItem ? (
                      <p className="text-sm text-gray-400">No price — open to offers</p>
                    ) : null}

                    <p className="mt-2 text-sm text-gray-600">{ad.description}</p>

                    <p className="mt-3 text-xs text-gray-400">
                      {ad.user?.profile?.fullname || ad.user?.email || 'Unknown seller'}
                      {ad.locations?.length ? ` · ${ad.locations.join(', ')}` : ''}
                    </p>
                  </div>
                </div>

                {status === 'PENDING' ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                    <input
                      value={reasons[ad.id] ?? ''}
                      onChange={(e) =>
                        setReasons((prev) => ({ ...prev, [ad.id]: e.target.value }))
                      }
                      placeholder="Reason (required to reject)"
                      className="min-w-[14rem] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                    />
                    <button
                      disabled={busy}
                      onClick={() => void decide(ad, 'REJECTED')}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => void decide(ad, 'APPROVED')}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                  </div>
                ) : ad.rejectionReason ? (
                  <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-500">
                    Rejected: {ad.rejectionReason}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdModerationReview;
