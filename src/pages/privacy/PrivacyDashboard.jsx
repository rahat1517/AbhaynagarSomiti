import { useEffect, useMemo, useState } from 'react';
import {
  downloadPersonalDataJson,
  getMyPersonalDataInventory,
  requestPermanentAccountDeletion,
} from '../../services/privacyService';

export default function PrivacyDashboard() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  const summaryCards = useMemo(() => {
    if (!inventory) return [];

    return [
      {
        label: 'Career Posts',
        value: inventory.career_posts?.length || 0,
      },
      {
        label: 'Applications',
        value: inventory.job_applications?.length || 0,
      },
      {
        label: 'Mentorship Records',
        value: inventory.mentorship_relations?.length || 0,
      },
      {
        label: 'Verification Requests',
        value: inventory.alumni_verification_requests?.length || 0,
      },
    ];
  }, [inventory]);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await getMyPersonalDataInventory();
      setInventory(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load personal data.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();

    setDeleting(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await requestPermanentAccountDeletion({
        reason,
        confirmationText,
      });

      setStatus({
        type: 'success',
        message:
          result.message ||
          'Your account and personal data were deleted successfully.',
      });

      setInventory(null);
      setReason('');
      setConfirmationText('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Permanent deletion failed.',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              PDPO 2025
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Data Privacy Dashboard
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              View the personal data stored about your account, export it as
              JSON, and request permanent account deletion.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadInventory}
              className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Refresh
            </button>

            <button
              type="button"
              disabled={!inventory}
              onClick={() => downloadPersonalDataJson(inventory)}
              className="min-h-12 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Export JSON
            </button>
          </div>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
            Loading your personal data...
          </div>
        ) : null}

        {!loading && inventory ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            <section className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <SummaryCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                  />
                ))}
              </div>

              <DataSection title="Base Profile">
                <KeyValueGrid data={inventory.profile} />
              </DataSection>

              {inventory.student_profile ? (
                <DataSection title="Student Profile">
                  <KeyValueGrid data={inventory.student_profile} />
                </DataSection>
              ) : null}

              {inventory.alumni_profile ? (
                <DataSection title="Alumni Profile">
                  <KeyValueGrid data={inventory.alumni_profile} />
                </DataSection>
              ) : null}

              <DataSection title="Visibility Preferences">
                <KeyValueGrid data={inventory.visibility_preferences || {}} />
              </DataSection>

              <DataSection title="Career Posts">
                <JsonList data={inventory.career_posts || []} />
              </DataSection>

              <DataSection title="Job Applications">
                <JsonList data={inventory.job_applications || []} />
              </DataSection>

              <DataSection title="Mentorship Relations">
                <JsonList data={inventory.mentorship_relations || []} />
              </DataSection>

              <DataSection title="Alumni Verification Requests">
                <JsonList data={inventory.alumni_verification_requests || []} />
              </DataSection>
            </section>

            <aside className="lg:sticky lg:top-5 lg:self-start">
              <DeletionPanel
                reason={reason}
                setReason={setReason}
                confirmationText={confirmationText}
                setConfirmationText={setConfirmationText}
                deleting={deleting}
                onSubmit={handleDeleteAccount}
              />
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function DeletionPanel({
  reason,
  setReason,
  confirmationText,
  setConfirmationText,
  deleting,
  onSubmit,
}) {
  const confirmationMatches = confirmationText === 'DELETE MY ACCOUNT';

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-red-200 bg-white p-5 shadow-soft md:p-6"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">
        Danger Zone
      </p>

      <h2 className="mt-2 text-xl font-bold text-slate-950">
        Request Permanent Account Deletion
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        This action deletes your Supabase Auth account, profile rows, student or
        alumni profile, uploaded alumni certificate files, job/application
        records, mentorship records, and related privacy records.
      </p>

      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
        This is irreversible. Export your personal data before continuing.
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Reason
        </span>

        <textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
          placeholder="Optional reason for deletion"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Type DELETE MY ACCOUNT
        </span>

        <input
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
          placeholder="DELETE MY ACCOUNT"
        />
      </label>

      <button
        type="submit"
        disabled={deleting || !confirmationMatches}
        className="mt-5 min-h-12 w-full rounded-2xl bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
      >
        {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
      </button>
    </form>
  );
}

function DataSection({ title, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function KeyValueGrid({ data }) {
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No data found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {key.replaceAll('_', ' ')}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {formatValue(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function JsonList({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No records found.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <details
          key={item.id || index}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <summary className="cursor-pointer text-sm font-bold text-slate-900">
            Record {index + 1}
          </summary>

          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {JSON.stringify(item, null, 2)}
          </pre>
        </details>
      ))}
    </div>
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

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}