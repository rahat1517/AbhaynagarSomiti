import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ProfileDetailsModal } from '../../components/MemberProfileDetails';
import {
  getDirectoryProfileDetails,
  getMemberTypeLabel,
  searchDirectoryProfiles,
} from '../../services/directoryService';

const initialFilters = {
  role: '',
  searchText: '',
  departmentName: '',
  hall: '',
  graduationYear: '',
  currentCompany: '',
  designation: '',
};

export default function DirectoryPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const observerRef = useRef(null);
  const lastItemRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, is_verified, verification_status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load viewer profile:', error);
      }

      setViewerProfile(profile);
      setAuthChecked(true);
    }

    checkAuth();
  }, [navigate]);

  const canViewDirectory =
    viewerProfile?.role === 'admin' || viewerProfile?.is_verified === true;

  const lastCursor = useMemo(() => {
    if (profiles.length === 0) return null;
    return profiles[profiles.length - 1];
  }, [profiles]);

  const loadProfiles = useCallback(
    async ({ reset = false } = {}) => {
      const activeFilters = reset ? filters : appliedFilters;

      if (reset) {
        setLoading(true);
        setProfiles([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      setStatus({ type: '', message: '' });

      try {
        const data = await searchDirectoryProfiles({
          filters: activeFilters,
          cursor: reset ? null : lastCursor,
          limit: 20,
        });

        setProfiles((current) => {
          if (reset) return data;

          const existingIds = new Set(current.map((item) => item.profile_id));
          const uniqueNext = data.filter(
            (item) => !existingIds.has(item.profile_id)
          );

          return [...current, ...uniqueNext];
        });

        setHasMore(data.length === 20);
      } catch (error) {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to load directory.',
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [appliedFilters, filters, lastCursor]
  );

  useEffect(() => {
    if (!authChecked || !canViewDirectory) return;

    loadProfiles({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, canViewDirectory]);

  useEffect(() => {
    if (!lastItemRef.current || !hasMore || loadingMore || loading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const firstEntry = entries[0];

      if (firstEntry.isIntersecting) {
        loadProfiles({ reset: false });
      }
    });

    observerRef.current.observe(lastItemRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [profiles, hasMore, loadingMore, loading, loadProfiles]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function applyFilters() {
    const nextFilters = { ...filters };
    setAppliedFilters(nextFilters);
    setIsFilterDrawerOpen(false);
    loadProfilesWithFilters(nextFilters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    loadProfilesWithFilters(initialFilters);
  }

  async function loadProfilesWithFilters(nextFilters) {
    setLoading(true);
    setProfiles([]);
    setHasMore(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await searchDirectoryProfiles({
        filters: nextFilters,
        cursor: null,
        limit: 20,
      });

      setProfiles(data);
      setHasMore(data.length === 20);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load directory.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(profileId) {
    setDetailLoading(true);
    setSelectedProfile(null);
    setDetailError('');
    setIsProfileDrawerOpen(true);

    try {
      const data = await getDirectoryProfileDetails(profileId);
      setSelectedProfile(data);
    } catch (error) {
      setDetailError(error.message || 'Failed to load profile details.');
    } finally {
      setDetailLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <PanelMessage message="Checking session..." />
        </section>
      </main>
    );
  }

  if (!canViewDirectory) {
    return (
      <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
            Awaiting Approval
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Directory access is pending
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your registration is under admin review. Once approved, you will be
            able to browse the member directory here.
          </p>
          <Link
            to="/profile"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            View My Profile
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Member Portal
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Member Directory
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Browse verified members. Click Details to view full profile
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadProfiles({ reset: true })}
            disabled={loading}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <MemberPanelNav />

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <FilterPanel
                filters={filters}
                updateFilter={updateFilter}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
              />
            </div>
          </aside>

          <div className="rounded-3xl bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Registered Members
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? 'Loading members...'
                    : `${profiles.length} member(s) loaded`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="min-h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 lg:hidden"
              >
                Filters
              </button>
            </div>

            {loading ? <PanelMessage message="Loading directory..." /> : null}

            {!loading && !status.message && profiles.length === 0 ? (
              <PanelMessage message="No members found. Try adjusting your filters." />
            ) : null}

            <div className="mt-5 hidden overflow-x-auto xl:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-3">Full Name</th>
                    <th className="px-3 py-3">Member Type</th>
                    <th className="px-3 py-3">Academic Year</th>
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Address</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, index) => {
                    const isLast = index === profiles.length - 1;

                    return (
                      <tr
                        key={profile.profile_id}
                        ref={isLast ? lastItemRef : null}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4 font-semibold text-slate-900">
                          {profile.full_name || '-'}
                        </td>
                        <td className="px-3 py-4">
                          {profile.member_type_label || 'Member'}
                        </td>
                        <td className="px-3 py-4">
                          {profile.academic_year || '-'}
                        </td>
                        <td className="px-3 py-4">
                          {profile.university_subject ||
                            profile.department_name ||
                            '-'}
                        </td>
                        <td className="max-w-xs px-3 py-4 text-slate-600">
                          {profile.present_address || '-'}
                        </td>
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => openProfile(profile.profile_id)}
                            className="min-h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:hidden">
              {profiles.map((profile, index) => {
                const isLast = index === profiles.length - 1;

                return (
                  <ProfileCard
                    key={profile.profile_id}
                    profile={profile}
                    onOpen={() => openProfile(profile.profile_id)}
                    refProp={isLast ? lastItemRef : null}
                  />
                );
              })}
            </div>

            {loadingMore ? (
              <PanelMessage message="Loading more members..." />
            ) : null}

            {!hasMore && profiles.length > 0 ? (
              <PanelMessage message="End of directory results." />
            ) : null}
          </div>
        </div>
      </section>

      <MobileFilterDrawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      >
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
        />
      </MobileFilterDrawer>

      <ProfileDetailsModal
        open={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        loading={detailLoading}
        error={detailError}
        profile={selectedProfile}
        title="Member Details"
      />
    </main>
  );
}

function MemberPanelNav() {
  const location = useLocation();

  const items = [
    { to: '/directory', label: 'Directory' },
    { to: '/profile', label: 'Profile' },
    { to: '/career/jobs', label: 'Jobs' },
    { to: '/career/alumni', label: 'Alumni Career' },
  ];

  return (
    <nav className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
      {items.map((item) => {
        const isActive = location.pathname === item.to;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`min-h-11 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function FilterPanel({ filters, updateFilter, applyFilters, clearFilters }) {
  return (
    <div>
      <div>
        <h2 className="text-lg font-bold text-slate-950">Filters</h2>
        <p className="mt-1 text-sm text-slate-500">Refine directory results.</p>
      </div>

      <div className="mt-5 space-y-4">
        <SelectInput
          label="Role"
          name="role"
          value={filters.role}
          onChange={updateFilter}
          options={[
            { label: 'All', value: '' },
            { label: 'Students', value: 'student' },
            { label: 'Alumni', value: 'alumni' },
          ]}
        />

        <TextInput
          label="Search"
          name="searchText"
          value={filters.searchText}
          onChange={updateFilter}
          placeholder="Name, hall, department..."
        />

        <TextInput
          label="Department"
          name="departmentName"
          value={filters.departmentName}
          onChange={updateFilter}
          placeholder="Software Engineering"
        />

        <TextInput
          label="Hall"
          name="hall"
          value={filters.hall}
          onChange={updateFilter}
          placeholder="Fazlul Huq Muslim Hall"
        />

        <TextInput
          label="Session"
          name="graduationYear"
          value={filters.graduationYear}
          onChange={updateFilter}
          placeholder="2022-23"
        />

        <TextInput
          label="Current Company"
          name="currentCompany"
          value={filters.currentCompany}
          onChange={updateFilter}
          placeholder="Company name"
        />

        <TextInput
          label="Designation"
          name="designation"
          value={filters.designation}
          onChange={updateFilter}
          placeholder="Software Engineer"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={applyFilters}
          className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function getMemberTypeBadgeClass(memberType) {
  if (memberType === 'student') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (memberType === 'alumni') {
    return 'bg-indigo-50 text-indigo-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function ProfileCard({ profile, onOpen, refProp }) {
  const memberTypeLabel =
    profile.member_type_label || getMemberTypeLabel(profile.member_type);

  return (
    <article
      ref={refProp}
      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-slate-200">
          {profile.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name || 'Member'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-400">
              {(profile.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-black text-slate-950">
            {profile.full_name || profile.email || 'Unnamed Member'}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getMemberTypeBadgeClass(
                profile.member_type
              )}`}
            >
              {memberTypeLabel}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <InfoItem
          label="Academic Year"
          value={profile.academic_year}
        />
        <InfoItem
          label="Subject"
          value={profile.university_subject || profile.department_name}
        />
        <InfoItem label="Hall" value={profile.hall} />
        <InfoItem
          label="Address"
          value={profile.present_address}
        />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
      >
        Details
      </button>
    </article>
  );
}

function MobileFilterDrawer({ open, onClose, children }) {
  return (
    <div
      className={`fixed inset-0 z-40 md:hidden ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Directory Filters
            </h2>
            <p className="text-sm text-slate-500">Find members faster.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-2xl border border-slate-300 px-4 text-sm font-bold text-slate-700"
          >
            Close
          </button>
        </div>

        {children}
      </aside>
    </div>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectInput({ label, name, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value || ''}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function PanelMessage({ message }) {
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      {message}
    </div>
  );
}