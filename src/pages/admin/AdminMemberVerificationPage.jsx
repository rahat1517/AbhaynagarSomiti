import { useEffect, useState } from 'react';
import {
  getMemberDetails,
  listPendingMembers,
  reviewMemberRegistration,
} from '../../services/adminMemberService';
import { ProfileDetailsModal } from '../../components/MemberProfileDetails';

export default function AdminMemberVerificationPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

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

  async function openDetails(profileId) {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError('');
    setSelectedMember(null);

    try {
      const data = await getMemberDetails(profileId);
      setSelectedMember(data);
    } catch (error) {
      setDetailsError(error.message || 'Failed to load member details.');
    } finally {
      setDetailsLoading(false);
    }
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
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              Member Requests
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review pending registrations. Approved members appear in the
              directory.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMembers}
            className="min-h-11 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 rounded-3xl bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
                Pending Members
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? 'Loading...'
                  : `${members.length} pending request(s)`}
              </p>
            </div>

            {members.length > 0 ? (
              <span className="w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                {members.length} New
              </span>
            ) : null}
          </div>

          {loading ? <PanelMessage message="Loading pending members..." /> : null}

          {!loading && members.length === 0 ? (
            <PanelMessage message="No pending member requests found." />
          ) : null}

          {!loading && members.length > 0 ? (
            <>
              <div className="mt-5 hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-3">Full Name</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Member Type</th>
                      <th className="px-3 py-3">Academic Year</th>
                      <th className="px-3 py-3">Subject</th>
                      <th className="px-3 py-3">Address</th>
                      <th className="px-3 py-3">Registered</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <PendingMemberRow
                        key={member.profile_id}
                        member={member}
                        remark={remarks[member.profile_id] || ''}
                        onRemarkChange={(value) =>
                          updateRemark(member.profile_id, value)
                        }
                        reviewing={reviewingId === member.profile_id}
                        onDetails={() => openDetails(member.profile_id)}
                        onApprove={() =>
                          handleReview(member.profile_id, 'approved')
                        }
                        onReject={() =>
                          handleReview(member.profile_id, 'rejected')
                        }
                        layout="table"
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:hidden">
                {members.map((member) => (
                  <PendingMemberRow
                    key={member.profile_id}
                    member={member}
                    remark={remarks[member.profile_id] || ''}
                    onRemarkChange={(value) =>
                      updateRemark(member.profile_id, value)
                    }
                    reviewing={reviewingId === member.profile_id}
                    onDetails={() => openDetails(member.profile_id)}
                    onApprove={() =>
                      handleReview(member.profile_id, 'approved')
                    }
                    onReject={() =>
                      handleReview(member.profile_id, 'rejected')
                    }
                    layout="card"
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <ProfileDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        loading={detailsLoading}
        error={detailsError}
        profile={selectedMember}
        title="Pending Member Details"
      />
    </main>
  );
}

function PendingMemberRow({
  member,
  remark,
  onRemarkChange,
  reviewing,
  onDetails,
  onApprove,
  onReject,
  layout,
}) {
  const registeredDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString()
    : '-';

  const actions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={onDetails}
        className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        View Details
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={reviewing}
        className="min-h-11 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {reviewing ? 'Processing...' : 'Reject'}
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={reviewing}
        className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {reviewing ? 'Processing...' : 'Approve'}
      </button>
    </div>
  );

  if (layout === 'table') {
    return (
      <tr className="border-b border-slate-100 align-top">
        <td className="px-3 py-4 font-semibold text-slate-900">
          {member.full_name || '-'}
        </td>
        <td className="px-3 py-4 text-slate-600">{member.email || '-'}</td>
        <td className="px-3 py-4">{member.member_type_label || 'Member'}</td>
        <td className="px-3 py-4">{member.academic_year || '-'}</td>
        <td className="px-3 py-4">{member.university_subject || '-'}</td>
        <td className="max-w-xs px-3 py-4 text-slate-600">
          {member.present_address || '-'}
        </td>
        <td className="px-3 py-4 text-slate-600">{registeredDate}</td>
        <td className="px-3 py-4">{actions}</td>
      </tr>
    );
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            {member.full_name || 'Unnamed Member'}
          </h3>
          <p className="mt-1 break-words text-sm text-slate-500">
            {member.email}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          Pending
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoItem label="Member Type" value={member.member_type_label} />
        <InfoItem label="Academic Year" value={member.academic_year} />
        <InfoItem label="Subject" value={member.university_subject} />
        <InfoItem label="Registered" value={registeredDate} />
        <div className="sm:col-span-2">
          <InfoItem label="Present Address" value={member.present_address} />
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Admin Remarks
        </span>
        <textarea
          rows={2}
          value={remark}
          onChange={(event) => onRemarkChange(event.target.value)}
          placeholder="Optional remarks"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <div className="mt-4">{actions}</div>
    </article>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
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
