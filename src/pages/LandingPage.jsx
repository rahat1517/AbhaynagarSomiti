import { useEffect, useMemo, useState } from 'react';
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

      setMembers(data || []);
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white sm:p-8 lg:p-10">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_45%)]" />

              <div className="relative max-w-4xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300 sm:text-xs sm:tracking-[0.35em]">
                  About Dhabi Abhaynagar Poribar
                </p>

                <h2 className="mt-4 text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Dhabi Abhaynagar Poribar - Student and Alumni Community
                </h2>

              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-7">
                <p className="text-sm font-bold text-emerald-700">
                  ঢাকা বিশ্ববিদ্যালয় সংশ্লিষ্ট সামাজিক সংগঠন
                </p>

                <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                  ঢাবি অভয়নগর পরিবার
                </h3>

                <p className="mt-3 text-base font-semibold leading-8 text-slate-700 sm:text-lg">
                  অভয়নগরের সন্তান, ঢাকা বিশ্ববিদ্যালয়ের শিক্ষার্থী একসাথে
                  এগিয়ে চলার প্রতিশ্রুতি।
                </p>

                <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  ঢাবি অভয়নগর পরিবার হলো অভয়নগরের বাসিন্দা যারা ঢাকা
                  বিশ্ববিদ্যালয়ে অধ্যয়নরত আছেন বা ছিলেন এমন সকল প্রাক্তন ও
                  বর্তমান শিক্ষার্থীদের নিয়ে গঠিত একটি সামাজিক ও সহযোগিতামূলক
                  সংগঠন। আমাদের এই প্ল্যাটফর্মটি মূলত শিক্ষার্থীদের সাথে এলাকার
                  মানুষের যোগাযোগের একটি কার্যকর মাধ্যম।
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-sm">
                  স্বপ্ন
                </div>

                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  আমাদের স্বপ্ন
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">
                  অভয়নগরের প্রতিটি শিক্ষার্থী যেন ঢাকা বিশ্ববিদ্যালয়ে নিরাপদ,
                  সুন্দর এবং সফল জীবন গড়তে পারে এবং ভবিষ্যতে নিজের এলাকা ও
                  দেশের জন্য অবদান রাখতে সক্ষম হয়।
                </p>
              </div>
            </div>
          </section>
          <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-soft sm:p-8 lg:p-9">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div className="mt-6 grid grid-cols-2 gap-3">
                <SummaryCard label="Current Students" value={studentCount} />
                <SummaryCard label="Alumni" value={alumniCount} />
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft sm:p-7 lg:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600 sm:text-xs sm:tracking-[0.28em]">
              Member Search
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              Public Member Directory
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
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
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
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
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Search
                </span>

                <input
                  value={draftFilters.searchText}
                  onChange={(event) =>
                    updateDraftField('searchText', event.target.value)
                  }
                  placeholder="Name or department"
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-sm"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-12 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search Members'}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="min-h-12 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600 sm:text-xs sm:tracking-[0.35em]">
                Public Directory
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                Verified Members
              </h2>
            </div>

            <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
              {members.length} member{members.length === 1 ? '' : 's'} found
            </p>
          </div>

          {status.message ? (
            <StatusBox type={status.type} message={status.message} />
          ) : null}

          {loading ? (
            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Loading members...
            </div>
          ) : null}

          {!loading && members.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No verified members found.
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <PublicMemberCard key={member.profile_id} member={member} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function PublicMemberCard({ member }) {
  const memberType = getMemberType(member);
  const label = getMemberTypeLabel(member);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-16 sm:w-16">
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

      <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm">
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