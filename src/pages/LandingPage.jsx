import { useEffect, useMemo, useState } from 'react';
import { listPublicMembers } from '../services/publicDirectoryService';

const initialFilters = {
  role: '',
  academicSession: '',
  searchText: '',
};

export default function LandingPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const studentCount = useMemo(
    () => members.filter((item) => item.role === 'student').length,
    [members]
  );

  const alumniCount = useMemo(
    () => members.filter((item) => item.role === 'alumni').length,
    [members]
  );

  useEffect(() => {
    loadMembers(initialFilters);
  }, []);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function loadMembers(nextFilters = filters) {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await listPublicMembers(nextFilters);
      setMembers(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load public members.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters(event) {
    event.preventDefault();
    await loadMembers(filters);
  }

  async function clearFilters() {
    setFilters(initialFilters);
    await loadMembers(initialFilters);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-soft md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Student Alumni Association
            </p>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              Dhabi Abhaynagar Poribar
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
              Dhabi Abhaynagar Poribar is an online community platform for
              Abhaynagar students, alumni, verified members, and local people
              connected with Dhaka University and Abhaynagar.
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">
              Also known as DU Abhaynagar Poribar, Dhaka University Abhaynagar
              community, and Abhaynagar Student Alumni Association.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatCard label="Current Students" value={studentCount} />
              <StatCard label="Alumni" value={alumniCount} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Public Member Search
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Search verified members of Dhabi Abhaynagar Poribar by role,
              session, name or department.
            </p>

            <form
              onSubmit={applyFilters}
              className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <SelectInput
                label="Member Type"
                name="role"
                value={filters.role}
                onChange={updateFilter}
                options={[
                  { label: 'All', value: '' },
                  { label: 'Current Students', value: 'student' },
                  { label: 'Alumni', value: 'alumni' },
                ]}
              />

              <TextInput
                label="Session"
                name="academicSession"
                value={filters.academicSession}
                onChange={updateFilter}
                placeholder="2023-24"
              />

              <TextInput
                label="Search"
                name="searchText"
                value={filters.searchText}
                onChange={updateFilter}
                placeholder="Name or department"
              />

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="min-h-12 flex-1 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Search
                </button>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-5 shadow-soft md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
            About Dhabi Abhaynagar Poribar
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            DU Abhaynagar Poribar and Student Alumni Community
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            Dhabi Abhaynagar Poribar helps Abhaynagar students, alumni, and
            verified community members stay connected through a secure online
            directory, profile system, privacy controls, and career networking
            features.
          </p>
        </section>

        {status.message ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {status.message}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
                Public Directory
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Verified Members
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              {members.length} members found
            </p>
          </div>

          {loading ? (
            <PanelMessage message="Loading public members..." />
          ) : null}

          {!loading && members.length === 0 ? (
            <PanelMessage message="No verified members found." />
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <PublicMemberCard key={member.profile_id} member={member} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function PublicMemberCard({ member }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-slate-100">
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
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
              member.role === 'student'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {member.role === 'student' ? 'Current Student' : 'Alumni'}
          </span>

          <h3 className="mt-3 break-words text-lg font-black text-slate-950">
            {member.full_name || '-'}
          </h3>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <InfoLine label="Department" value={member.department_name} />
        <InfoLine label="Session" value={member.academic_session} />
      </div>
    </article>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function TextInput({ label, name, value, onChange, placeholder = '' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectInput({ label, name, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((item) => (
          <option key={item.value || 'all'} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>

      <span className="text-right font-bold text-slate-900">
        {value || '-'}
      </span>
    </div>
  );
}

function PanelMessage({ message }) {
  return (
    <div className="mt-5 rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
      {message}
    </div>
  );
}