import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  listStudentVerificationRequests,
  reviewStudentVerificationRequest,
} from '../../services/studentVerificationService';

export default function AdminStudentVerificationPage() {
  const [adminProfile, setAdminProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [remarksById, setRemarksById] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const profile = await getCurrentProfile();

      if (profile.role !== 'admin') {
        throw new Error('Admin access required.');
      }

      setAdminProfile(profile);

      const data = await listStudentVerificationRequests();
      setRequests(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load student verification page.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentProfile() {
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

  async function reviewRequest(requestId, nextStatus) {
    setActionLoadingId(requestId);
    setStatus({ type: '', message: '' });

    try {
      const result = await reviewStudentVerificationRequest({
        requestId,
        status: nextStatus,
        adminRemarks: remarksById[requestId] || '',
      });

      setStatus({
        type: 'success',
        message: result.message || `Student ${nextStatus} successfully.`,
      });

      await initializePage();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Review failed.',
      });
    } finally {
      setActionLoadingId('');
    }
  }

  if (loading && !adminProfile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">
            Loading student verification requests...
          </p>
        </section>
      </main>
    );
  }

  if (status.type === 'error' && !adminProfile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-soft">
          <StatusBox type="error" message={status.message} />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Super Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Student Verification Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Students who failed roster auto-verification will appear here for
              manual review.
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              Logged in as {adminProfile?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={initializePage}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 space-y-4">
          {loading ? (
            <PanelMessage message="Loading requests..." />
          ) : null}

          {!loading && requests.length === 0 ? (
            <PanelMessage message="No student verification requests found." />
          ) : null}

          {requests.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl bg-white p-5 shadow-soft md:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">
                      {item.email}
                    </h2>

                    <StatusBadge status={item.status} />
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Roll Number" value={item.roll_number} />
                <Info label="Department" value={item.department_name} />
                <Info label="Semester" value={item.current_semester} />
                <Info label="Session" value={item.academic_session} />
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Admin Remarks
                </span>

                <textarea
                  rows={3}
                  value={remarksById[item.id] || item.admin_remarks || ''}
                  onChange={(event) =>
                    setRemarksById((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Optional reason or note"
                />
              </label>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    actionLoadingId === item.id || item.status === 'rejected'
                  }
                  onClick={() => reviewRequest(item.id, 'rejected')}
                  className="min-h-12 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={
                    actionLoadingId === item.id || item.status === 'approved'
                  }
                  onClick={() => reviewRequest(item.id, 'approved')}
                  className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  Approve
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value || '-'}</p>
    </div>
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
    <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
      {message}
    </div>
  );
}