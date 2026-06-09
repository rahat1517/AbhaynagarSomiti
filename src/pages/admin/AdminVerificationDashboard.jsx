import { useEffect, useState } from 'react';
import {
  approveMemberProfile,
  getPendingMemberRequests,
  rejectMemberProfile,
} from '../../services/adminVerificationService';

export default function AdminVerificationDashboard() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });

  async function loadPendingMembers() {
    setIsLoading(true);
    setNotice({ type: '', message: '' });

    try {
      const data = await getPendingMemberRequests();
      setMembers(data);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Failed to load member requests.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingMembers();
  }, []);

  async function handleApprove(profileId) {
    setActionId(profileId);
    setNotice({ type: '', message: '' });

    try {
      await approveMemberProfile(profileId);

      setMembers((current) =>
        current.filter((member) => member.id !== profileId)
      );

      setNotice({
        type: 'success',
        message: 'Member approved successfully.',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Approve failed.',
      });
    } finally {
      setActionId('');
    }
  }

  async function handleReject(profileId) {
    const reason = window.prompt('Write rejection reason, optional:') || '';

    setActionId(profileId);
    setNotice({ type: '', message: '' });

    try {
      await rejectMemberProfile(profileId, reason);

      setMembers((current) =>
        current.filter((member) => member.id !== profileId)
      );

      setNotice({
        type: 'success',
        message: 'Member rejected successfully.',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.message || 'Reject failed.',
      });
    } finally {
      setActionId('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-5 text-white shadow md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Admin Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Member Verification Requests
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Review pending registrations and accept or reject members.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPendingMembers}
            disabled={isLoading}
            className="min-h-12 rounded-2xl bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {notice.message ? (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
              notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <section className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl bg-white p-6 text-sm font-semibold text-slate-500 shadow-soft">
              Loading pending members...
            </div>
          ) : null}

          {!isLoading && members.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-sm font-semibold text-slate-500 shadow-soft">
              No pending member request found.
            </div>
          ) : null}

          {members.map((member) => (
            <article
              key={member.id}
              className="rounded-3xl bg-white p-4 shadow-soft md:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt={member.full_name || 'Member'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">
                        {(member.full_name || '?').charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-950">
                        {member.full_name || 'No Name'}
                      </h2>

                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-700">
                        {member.verification_status || 'pending'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {member.email || 'No email'}
                    </p>

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <Info label="WhatsApp" value={member.contact_number} />
                      <Info label="Hall" value={member.university_hall_name} />
                      <Info
                        label="Session"
                        value={member.first_year_admission_session}
                      />
                      <Info label="Subject" value={member.university_subject} />
                      <Info
                        label="Union/Pouroshova"
                        value={member.union_pouroshova_name}
                      />
                      <Info label="Occupation" value={member.occupation} />
                    </dl>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    disabled={actionId === member.id}
                    onClick={() => handleApprove(member.id)}
                    className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {actionId === member.id ? 'Processing...' : 'Accept'}
                  </button>

                  <button
                    type="button"
                    disabled={actionId === member.id}
                    onClick={() => handleReject(member.id)}
                    className="min-h-12 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionId === member.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>

              {member.present_address ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <span className="font-bold text-slate-700">Address:</span>{' '}
                  {member.present_address}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </section>
    </main>
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