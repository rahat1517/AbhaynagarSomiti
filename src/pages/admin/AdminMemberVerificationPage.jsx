import { useEffect, useState } from 'react';
import {
  listPendingMembers,
  reviewMemberRegistration,
} from '../../services/adminMemberService';

export default function AdminMemberVerificationPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await listPendingMembers();
      setMembers(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load pending members.',
      });
    } finally {
      setLoading(false);
    }
  }

  function updateRemark(profileId, value) {
    setRemarks((current) => ({
      ...current,
      [profileId]: value,
    }));
  }

  async function handleReview(profileId, nextStatus) {
    setReviewingId(profileId);
    setStatus({ type: '', message: '' });

    try {
      const result = await reviewMemberRegistration({
        profileId,
        status: nextStatus,
        adminRemarks: remarks[profileId] || '',
      });

      setStatus({
        type: 'success',
        message:
          result?.message ||
          (nextStatus === 'approved'
            ? 'Member approved successfully.'
            : 'Member rejected successfully.'),
      });

      await loadMembers();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Review failed.',
      });
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Admin Panel
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Member Verification
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              New registrations will appear here. Approve to make members
              visible in public and directory.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMembers}
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
                Pending Registrations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {members.length} pending member(s)
              </p>
            </div>

            {members.length > 0 ? (
              <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                {members.length} New
              </span>
            ) : null}
          </div>

          {loading ? <PanelMessage message="Loading pending members..." /> : null}

          {!loading && members.length === 0 ? (
            <PanelMessage message="No pending member registration found." />
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {members.map((member) => (
              <MemberCard
                key={member.profile_id}
                member={member}
                remark={remarks[member.profile_id] || ''}
                onRemarkChange={(value) =>
                  updateRemark(member.profile_id, value)
                }
                reviewing={reviewingId === member.profile_id}
                onApprove={() => handleReview(member.profile_id, 'approved')}
                onReject={() => handleReview(member.profile_id, 'rejected')}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MemberCard({
  member,
  remark,
  onRemarkChange,
  reviewing,
  onApprove,
  onReject,
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-slate-200">
          {member.profile_photo_url ? (
            <img
              src={member.profile_photo_url}
              alt={member.full_name || 'Member'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-400">
              {(member.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-black text-slate-950">
            {member.full_name || 'Unnamed Member'}
          </h3>

          <p className="mt-1 break-words text-sm text-slate-500">
            {member.email}
          </p>

          <span className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            Pending Verification
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <InfoItem label="Nick Name" value={member.nick_name} />
        <InfoItem label="Mobile" value={member.mobile_number} />
        <InfoItem label="Hall" value={member.university_hall_name} />
        <InfoItem
          label="Session"
          value={member.first_year_admission_session}
        />
        <InfoItem label="Subject" value={member.university_subject} />
        <InfoItem label="Occupation" value={member.occupation} />
      </div>

      <div className="mt-4">
        <InfoItem
          label="University Document"
          value={
            member.university_document_url
              ? member.university_document_url
              : 'Not uploaded'
          }
        />
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

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {value || '-'}
      </p>
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

function PanelMessage({ message }) {
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}