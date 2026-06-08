import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublicMembers } from '../services/publicDirectoryService';

function getMemberType(member) {
  const directType = String(member?.member_type || '').trim().toLowerCase();
  const occupation = String(member?.occupation || '').trim().toLowerCase();

  if (directType === 'student') return 'student';
  if (directType === 'alumni') return 'alumni';

  if (occupation === 'student' || occupation === 'current student') {
    return 'student';
  }

  return 'alumni';
}

function getMemberTypeLabel(member) {
  return getMemberType(member) === 'student' ? 'Current Student' : 'Alumni';
}

const initialFilters = {
  role: '',
  academicSession: '',
  searchText: '',
};

export default function LandingPage() {
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    loadMembers(initialFilters);
  }, []);

  const studentCount = useMemo(() => {
    return members.filter((item) => getMemberType(item) === 'student').length;
  }, [members]);

  const alumniCount = useMemo(() => {
    return members.filter((item) => getMemberType(item) === 'alumni').length;
  }, [members]);

  async function loadMembers(nextFilters = filters) {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await listPublicMembers({
        role: nextFilters.role,
        academicSession: nextFilters.academicSession,
        searchText: nextFilters.searchText,
      });

      setMembers(data);
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load public members.',
      });
    } finally {
      setLoading(false);
    }
  }

  function updateDraftField(name, value) {
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();
    loadMembers(draftFilters);
  }

  function handleClear() {
    setDraftFilters(initialFilters);
    loadMembers(initialFilters);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-black text-slate-950">
              Abhaynagar Somiti
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="min-h-11 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="min-h-11 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      <section className="px-3 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-soft sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-300">
              Student Alumni Association
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              Connect Current Students and Alumni by Session
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Public visitors can see verified members by name, department,
              session and occupation only. Full details are available after
              login according to privacy rules.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryCard label="Current Students" value={studentCount} />
              <SummaryCard label="Alumni" value={alumniCount} />
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="rounded-3xl bg-white p-5 shadow-soft sm:p-7"
          >
            <h2 className="text-xl font-black text-slate-950">
              Public Member Search
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search by member type, session, name or department.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Member Type
                </span>

                <select
                  value={draftFilters.role}
                  onChange={(event) =>
                    updateDraftField('role', event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">All Members</option>
                  <option value="student">Current Students</option>
                  <option value="alumni">Alumni / Others</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Session
                </span>

                <input
                  value={draftFilters.academicSession}
                  onChange={(event) =>
                    updateDraftField('academicSession', event.target.value)
                  }
                  placeholder="2023-24"
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Search
                </span>

                <input
                  value={draftFilters.searchText}
                  onChange={(event) =>
                    updateDraftField('searchText', event.target.value)
                  }
                  placeholder="Name or department"
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-12 flex-1 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="px-3 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-5 shadow-soft sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-600">
              About Dhabi Abhaynagar Poribar
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              DU Abhaynagar Poribar and Student Alumni Community
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Dhabi Abhaynagar Poribar helps Abhaynagar students, alumni, and
              verified community members stay connected through a secure online
              directory, profile system, privacy controls, and career networking
              features.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-600">
                Public Directory
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Verified Members
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              {members.length} member{members.length === 1 ? '' : 's'} found
            </p>
          </div>

          {status.message ? (
            <StatusBox type={status.type} message={status.message} />
          ) : null}

          {loading ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Loading members...
            </div>
          ) : null}

          {!loading && members.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No verified members found.
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <MemberCard key={member.profile_id} member={member} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MemberCard({ member }) {
  const memberType = getMemberType(member);
  const label = getMemberTypeLabel(member);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {member.profile_photo_url ? (
            <img
              src={member.profile_photo_url}
              alt={member.full_name || 'Member'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-black text-slate-400">
              {(member.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
              memberType === 'student'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {label}
          </span>

          <h3 className="mt-2 break-words text-base font-black text-slate-950">
            {member.full_name || 'Unnamed Member'}
          </h3>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <InfoLine label="Department" value={member.department_name} />
        <InfoLine label="Session" value={member.academic_session} />

        {memberType === 'alumni' ? (
          <InfoLine label="Occupation" value={member.occupation} />
        ) : null}
      </div>
    </article>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="break-words text-right font-bold text-slate-900">
        {value || '-'}
      </span>
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