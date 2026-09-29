import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LandlordAccessRequest,
  approveLandlordAccessRequest,
  getLandlordAccessRequests,
  rejectLandlordAccessRequest,
} from '../services/adminService';

/**
 * Landlords who asked for access from the public website.
 *
 * Approving one sends the ordinary landlord invitation — the same account,
 * email and set-password link an admin-invited landlord has always received.
 * Nothing about that invitation changes here; this screen only decides who
 * gets one.
 */

type Filter = LandlordAccessRequest['status'] | 'ALL';

const STATUS_STYLE: Record<LandlordAccessRequest['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-gray-200 text-gray-700',
};

const fullName = (request: LandlordAccessRequest) =>
  [request.firstName, request.lastName].filter(Boolean).join(' ').trim();

const LandlordAccessRequests: React.FC = () => {
  const [requests, setRequests] = useState<LandlordAccessRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** The id currently being approved or rejected, so only its row is busy. */
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /**
   * Set only when the invitation email failed. Telling an admin to share the
   * link without showing it leaves them nothing to share — the approval has
   * already happened by then, so this is the only copy they get.
   */
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await getLandlordAccessRequests(filter === 'ALL' ? undefined : filter));
    } catch {
      setError('Could not load requests. Try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    request: LandlordAccessRequest,
    action: 'approve' | 'reject'
  ) => {
    if (action === 'reject') {
      // A rejection is invisible to the requester, so the note is for whoever
      // opens this next and wonders why.
      const note = window.prompt(`Why are you rejecting ${request.email}?`);
      if (note === null) return;
      setWorking(request.id);
      try {
        await rejectLandlordAccessRequest(request.id, note || undefined);
        setFallbackLink(null);
        setNotice(`Rejected ${request.email}.`);
        await load();
      } catch {
        setError(`Could not reject ${request.email}.`);
      } finally {
        setWorking(null);
      }
      return;
    }

    if (!window.confirm(`Approve ${request.email} and send their landlord invitation?`)) {
      return;
    }
    setWorking(request.id);
    try {
      const result: any = await approveLandlordAccessRequest(request.id);
      const emailFailed = result?.data?.emailSent === false;
      setFallbackLink(emailFailed ? result?.data?.invitationLink ?? null : null);
      setNotice(
        emailFailed
          ? `Approved ${request.email}, but the invitation email did not send — send them the link below.`
          : `Approved ${request.email}. Their invitation is on its way.`
      );
      await load();
    } catch (err: any) {
      setError(err?.message || `Could not approve ${request.email}.`);
    } finally {
      setWorking(null);
    }
  };

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'PENDING').length,
    [requests]
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Landlord access requests</h1>
          <p className="text-sm text-gray-500">
            People asking to be let in as landlords. Approving sends them the
            normal landlord invitation.
          </p>
        </div>
        <div className="flex gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                filter === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
              {value === 'PENDING' && pendingCount ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {notice ? (
        <div className="mb-3 rounded-md bg-green-50 px-4 py-2 text-sm text-green-800">
          {notice}
        </div>
      ) : null}
      {fallbackLink ? (
        <div className="mb-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="mb-2 font-medium">Their set-password link</p>
          <code className="block break-all rounded bg-white px-2 py-1 text-xs">
            {fallbackLink}
          </code>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(fallbackLink)}
            className="mt-2 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Copy link
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          {filter === 'PENDING'
            ? 'Nothing waiting for a decision.'
            : 'No requests here.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">What they said</th>
                <th className="px-4 py-3">Asked</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {fullName(request) || '—'}
                  </td>
                  <td className="px-4 py-3">{request.email}</td>
                  <td className="px-4 py-3">{request.phoneNumber || '—'}</td>
                  <td className="max-w-xs px-4 py-3 text-gray-600">
                    {request.message || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        STATUS_STYLE[request.status]
                      }`}
                    >
                      {request.status}
                    </span>
                    {request.reviewNote ? (
                      <span className="mt-1 block text-xs text-gray-500">
                        {request.reviewNote}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {request.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          disabled={working === request.id}
                          onClick={() => void act(request, 'approve')}
                          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {working === request.id ? 'Working…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={working === request.id}
                          onClick={() => void act(request, 'reject')}
                          className="ml-2 rounded-md px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {request.reviewedAt
                          ? `Decided ${new Date(request.reviewedAt).toLocaleDateString()}`
                          : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LandlordAccessRequests;
