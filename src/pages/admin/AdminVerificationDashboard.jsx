import { useEffect, useState } from 'react';
import {
  getSignedCertificateUrl,
  listAlumniVerificationRequests,
  reviewAlumniVerificationRequest,
} from '../../services/verificationService';
import { supabase } from '../../lib/supabaseClient';

export default function AdminVerificationDashboard() {
  const [requests, setRequests] = useState([]);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [remarksById, setRemarksById] = useState({});
  const [status, setStatus] = useState({
    type: '',
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const profile = await getMyProfile();

      if (profile.role !== 'admin') {
        throw new Error('Admin access required.');
      }

      const data = await listAlumniVerificationRequests();
      setRequests(data || []);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load verification requests.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function getMyProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error('Login required.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_verified')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async function openCertificate(requestItem) {
    try {
      const signedUrl = await getSignedCertificateUrl(
        requestItem.certificate_storage_path
      );

      setViewerUrl(signedUrl);
      setViewerTitle(
        `${requestItem.registration_no} - ${requestItem.hall}`
      );
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to open certificate.',
      });
    }
  }

  async function reviewRequest(requestId, nextStatus) {
    setActionLoadingId(requestId);
    setStatus({ type: '', message: '' });

    try {
      await reviewAlumniVerificationRequest({
        requestId,
        status: nextStatus,
        adminRemarks: remarksById[requestId] || '',
      });

      setStatus({
        type: 'success',
        message: `Request ${nextStatus} successfully.`,
      });

      await loadRequests();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Review failed.',
      });
    } finally {
      setActionLoadingId('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Alumni Verification Requests
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review uploaded graduation certificates and approve or reject
              alumni verification.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_460px]">
          <section className="space-y-4">
            {loading ? (
              <div className="rounded-3xl bg-white p-6 shadow-soft">
                Loading verification requests...
              </div>
            ) : null}

            {!loading && requests.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
                No alumni verification requests found.
              </div>
            ) : null}

            {requests.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl bg-white p-4 shadow-soft md:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">
                        {item.registration_no}
                      </h2>

                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {item.profiles?.email}
                    </p>

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                      <Info label="Graduation Year" value={item.graduation_year} />
                      <Info label="Hall" value={item.hall} />
                      <Info
                        label="Submitted"
                        value={new Date(item.created_at).toLocaleString()}
                      />
                    </dl>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCertificate(item)}
                    className="min-h-12 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    View PDF
                  </button>
                </div>

                <div className="mt-5">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Admin Remarks
                    </span>

                    <textarea
                      rows={3}
                      value={remarksById[item.id] || ''}
                      onChange={(event) =>
                        setRemarksById((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Optional remarks for approval/rejection"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={
                      actionLoadingId === item.id || item.status === 'rejected'
                    }
                    onClick={() => reviewRequest(item.id, 'rejected')}
                    className="min-h-12 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoadingId === item.id || item.status === 'approved'
                    }
                    onClick={() => reviewRequest(item.id, 'approved')}
                    className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    Approve
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="rounded-3xl bg-white p-4 shadow-soft lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Certificate Preview
                </h2>
                <p className="text-sm text-slate-500">
                  {viewerTitle || 'Select a request to view PDF.'}
                </p>
              </div>

              {viewerUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setViewerUrl('');
                    setViewerTitle('');
                  }}
                  className="min-h-12 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
                >
                  Close
                </button>
              ) : null}
            </div>

            <div className="mt-4 h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {viewerUrl ? (
                <iframe
                  title="Certificate PDF Preview"
                  src={viewerUrl}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
                  PDF preview will appear here.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-800">{value || '-'}</dd>
    </div>
  );
}