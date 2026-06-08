import { useEffect, useState } from 'react';
import {
  listMemberUpdateRequests,
  reviewMemberUpdateRequest,
} from '../../services/adminMemberService';

export default function AdminMemberUpdateRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await listMemberUpdateRequests();
      setRequests(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load update requests.',
      });
    } finally {
      setLoading(false);
    }
  }

  function updateRemark(requestId, value) {
    setRemarks((current) => ({
      ...current,
      [requestId]: value,
    }));
  }

  async function handleReview(requestId, nextStatus) {
    setReviewingId(requestId);
    setStatus({ type: '', message: '' });

    try {
      const result = await reviewMemberUpdateRequest({
        requestId,
        status: nextStatus,
        adminRemarks: remarks[requestId] || '',
      });

      setStatus({
        type: 'success',
        message:
          result?.message ||
          (nextStatus === 'approved'
            ? 'Update request approved.'
            : 'Update request rejected.'),
      });

      await loadRequests();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Review failed.',
      });
    } finally {
      setReviewingId(null);
    }
  }

  const pendingRequests = requests.filter((item) => item.status === 'pending');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Admin Panel
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Member Update Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              User profile updates are pending until admin approval.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Pending Update Requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {pendingRequests.length} pending request(s)
              </p>
            </div>

            {pendingRequests.length > 0 ? (
              <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                {pendingRequests.length} New
              </span>
            ) : null}
          </div>

          {loading ? <PanelMessage message="Loading update requests..." /> : null}

          {!loading && pendingRequests.length === 0 ? (
            <PanelMessage message="No pending update request found." />
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pendingRequests.map((request) => (
              <UpdateRequestCard
                key={request.request_id}
                request={request}
                remark={remarks[request.request_id] || ''}
                onRemarkChange={(value) =>
                  updateRemark(request.request_id, value)
                }
                reviewing={reviewingId === request.request_id}
                onApprove={() =>
                  handleReview(request.request_id, 'approved')
                }
                onReject={() => handleReview(request.request_id, 'rejected')}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function UpdateRequestCard({
  request,
  remark,
  onRemarkChange,
  reviewing,
  onApprove,
  onReject,
}) {
  const data = request.requested_data || {};
  const dataEntries = Object.entries(data).filter(([key]) => key !== '');

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="break-words text-lg font-black text-slate-950">
            {request.full_name || 'Unnamed Member'}
          </h3>

          <p className="mt-1 break-words text-sm text-slate-500">
            {request.email}
          </p>
        </div>

        <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          {request.status}
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-400">
        Requested at:{' '}
        {request.created_at
          ? new Date(request.created_at).toLocaleString()
          : '-'}
      </p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-bold text-slate-950">Requested Changes</p>

        {dataEntries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No data found.</p>
        ) : (
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {dataEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {formatKey(key)}
                </p>

                <pre className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">
                  {typeof value === 'object'
                    ? JSON.stringify(value, null, 2)
                    : String(value || '-')}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Admin Remarks
        </span>

        <textarea
          rows={3}
          value={remark}
          onChange={(event) => onRemarkChange(event.target.value)}
          placeholder="Optional remarks"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onReject}
          disabled={reviewing}
          className="min-h-12 rounded-2xl border border-red-200 bg-white px-5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {reviewing ? 'Processing...' : 'Reject'}
        </button>

        <button
          type="button"
          onClick={onApprove}
          disabled={reviewing}
          className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {reviewing ? 'Processing...' : 'Approve'}
        </button>
      </div>
    </article>
  );
}

function formatKey(key) {
  return String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBox({ type, message }) {
  return (
    <div
      className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
        type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  );
}

function PanelMessage({ message }) {
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}