import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getDirectoryProfileDetails,
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
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const observerRef = useRef(null);
  const lastItemRef = useRef(null);

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
    loadProfiles({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setIsProfileDrawerOpen(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await getDirectoryProfileDetails(profileId);
      setSelectedProfile(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load profile details.',
      });
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50">
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 px-4 py-6 text-white sm:px-6 sm:py-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-300 sm:text-sm">
              Directory
            </p>

            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                  Student & Alumni Directory
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Search verified students and alumni. Logged-in members can
                  view full profile details from this page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                <MiniStat label="Loaded" value={profiles.length} />
                <MiniStat label="Status" value={loading ? 'Loading' : 'Ready'} />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white/90 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="min-h-12 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-300/60 transition hover:bg-slate-800 md:hidden"
              >
                Open Filters
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:ml-auto">
                <p className="text-sm font-semibold text-slate-500">
                  {profiles.length} profiles loaded
                </p>

                <button
                  type="button"
                  onClick={() => loadProfiles({ reset: true })}
                  className="min-h-12 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {status.message ? (
            <div className="px-4 sm:px-6">
              <StatusBox type={status.type} message={status.message} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-[300px_1fr]">
            <aside className="hidden md:block">
              <div className="sticky top-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70">
                <FilterPanel
                  filters={filters}
                  updateFilter={updateFilter}
                  applyFilters={applyFilters}
                  clearFilters={clearFilters}
                />
              </div>
            </aside>

            <section>
              {loading ? <PanelMessage message="Loading directory..." /> : null}

              {!loading && profiles.length === 0 ? (
                <PanelMessage message="No matching verified profiles found." />
              ) : null}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                <PanelMessage message="Loading more profiles..." />
              ) : null}

              {!hasMore && profiles.length > 0 ? (
                <PanelMessage message="End of directory results." />
              ) : null}
            </section>
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

      <ProfileDetailsDrawer
        open={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        loading={detailLoading}
        profile={selectedProfile}
      />
    </main>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function FilterPanel({ filters, updateFilter, applyFilters, clearFilters }) {
  return (
    <div>
      <div>
        <h2 className="text-lg font-black text-slate-950">Filters</h2>
        <p className="mt-1 text-sm text-slate-500">
          Refine directory results.
        </p>
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
          className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function ProfileCard({ profile, onOpen, refProp }) {
  const isStudent = profile.role === 'student';

  return (
    <article
      ref={refProp}
      className="group rounded-[26px] border border-white bg-white p-4 shadow-lg shadow-slate-200/80 transition hover:-translate-y-1 hover:shadow-xl sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-emerald-50 ring-1 ring-slate-200 sm:h-20 sm:w-20">
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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-black sm:text-xs ${
                isStudent
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {isStudent ? 'Current Student' : 'Alumni'}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600 sm:text-xs">
              Verified
            </span>
          </div>

          <h2 className="mt-3 break-words text-base font-black leading-snug text-slate-950 sm:text-lg">
            {profile.full_name || profile.email || 'Unnamed Member'}
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
        <InfoLine label="Department" value={profile.department_name} />
        <InfoLine label="Hall" value={profile.hall} />
        <InfoLine label="Session" value={profile.academic_session} />

        {!isStudent ? (
          <>
            <InfoLine label="Occupation" value={profile.occupation} />
            <InfoLine
              label="Professional"
              value={profile.professional_details}
            />
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 min-h-12 w-full rounded-2xl bg-gradient-to-r from-slate-950 to-emerald-900 px-5 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:from-slate-800 hover:to-emerald-800"
      >
        View Details
      </button>
    </article>
  );
}

function ProfileDetailsDrawer({ open, onClose, loading, profile }) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${
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
        className={`absolute bottom-0 right-0 w-full rounded-t-[30px] bg-white shadow-2xl transition-transform duration-300 md:top-0 md:h-full md:max-w-2xl md:rounded-l-[30px] md:rounded-t-none ${
          open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Profile Details
            </h2>

            <p className="text-sm text-slate-500">
              Full verified member information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-2xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-5 md:max-h-[calc(100vh-82px)]">
          {loading ? (
            <PanelMessage message="Loading profile details..." />
          ) : null}

          {!loading && !profile ? (
            <PanelMessage message="Select a profile to view details." />
          ) : null}

          {!loading && profile ? (
            <ProfileDetailsContent profile={profile} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ProfileDetailsContent({ profile }) {
  const isStudent = profile.role === 'student';

  return (
    <div>
      <div className="rounded-[26px] bg-gradient-to-br from-slate-950 to-emerald-900 p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-white/10 ring-2 ring-white/20">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.full_name || 'Member'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white/70">
                {(profile.full_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                isStudent
                  ? 'bg-emerald-300 text-emerald-950'
                  : 'bg-indigo-300 text-indigo-950'
              }`}
            >
              {isStudent ? 'Current Student' : 'Alumni'}
            </span>

            <h3 className="mt-3 break-words text-xl font-black sm:text-2xl">
              {profile.full_name || profile.email || 'Unnamed Member'}
            </h3>

            {profile.nick_name ? (
              <p className="mt-1 text-sm text-slate-200">
                Nick Name: {profile.nick_name}
              </p>
            ) : null}

            <p className="mt-1 text-sm text-slate-300">
              Joined{' '}
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <DetailsGroup title="Basic Information">
        <DetailItem label="Full Name" value={profile.full_name} />
        <DetailItem label="Nick Name" value={profile.nick_name} />
        <DetailItem label="Date of Birth" value={profile.date_of_birth} />
        <DetailItem label="Gender" value={profile.gender} />
        <DetailItem label="Blood Group" value={profile.blood_group} />
      </DetailsGroup>

      <DetailsGroup title="Contact Information">
        <DetailItem label="Email" value={profile.email} />
        <DetailItem label="Contact Number" value={profile.contact_number} />
        <DetailItem
          label="Facebook Profile"
          value={profile.facebook_profile_link}
        />
      </DetailsGroup>

      <DetailsGroup title="University Information">
        <DetailItem label="Hall Name" value={profile.university_hall_name} />
        <DetailItem
          label="First Year Admission Session"
          value={profile.first_year_admission_session}
        />
        <DetailItem
          label="Subject / Department"
          value={profile.university_subject || profile.department_name}
        />
        <DetailItem
          label="University Document"
          value={profile.university_document_url ? 'Uploaded' : 'Not uploaded'}
        />
      </DetailsGroup>

      <DetailsGroup title="SSC Information">
        <DetailItem
          label="SSC Institute"
          value={profile.ssc_institution_name}
        />
        <DetailItem label="SSC Group" value={profile.ssc_group} />
        <DetailItem
          label="SSC Passing Year"
          value={profile.ssc_passing_year}
        />
        <DetailItem label="SSC GPA" value={profile.ssc_gpa} />
      </DetailsGroup>

      <DetailsGroup title="HSC Information">
        <DetailItem
          label="HSC Institute"
          value={profile.hsc_institution_name}
        />
        <DetailItem label="HSC Group" value={profile.hsc_group} />
        <DetailItem
          label="HSC Passing Year"
          value={profile.hsc_passing_year}
        />
        <DetailItem label="HSC GPA" value={profile.hsc_gpa} />
      </DetailsGroup>

      <DetailsGroup title="Address">
        <DetailItem
          label="Union / Pouroshova"
          value={profile.union_pouroshova_name}
        />
        <DetailItem
          label="Ward / Village"
          value={profile.ward_village_name}
        />
        <DetailItem
          label="Para / Moholla"
          value={profile.para_moholla_name}
        />
        <DetailItem label="Present Address" value={profile.present_address} />
      </DetailsGroup>

      <DetailsGroup title="Occupation">
        <DetailItem label="Occupation" value={profile.occupation} />
        <DetailItem
          label="Professional Details"
          value={profile.professional_details}
        />
      </DetailsGroup>

      {profile.member_degree_qualifications?.length ? (
        <DetailsGroup title="Higher Degree">
          {profile.member_degree_qualifications.map((degree, index) => (
            <div
              key={index}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"
            >
              <DetailItem label="Degree" value={degree.degree_name} />
              <DetailItem
                label="Institution"
                value={degree.institution_name}
              />
              <DetailItem
                label="Subject / Department"
                value={degree.subject_department}
              />
              <DetailItem label="Passing Year" value={degree.passing_year} />
            </div>
          ))}
        </DetailsGroup>
      ) : null}

      {profile.life_story ? (
        <div className="mt-5 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-black text-slate-950">
            Memories and Stories
          </h4>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
            {profile.life_story}
          </p>
        </div>
      ) : null}

      <DetailsGroup title="Verification">
        <DetailItem
          label="Verification Status"
          value={profile.verification_status}
        />
        <DetailItem
          label="Approved"
          value={profile.is_approved ? 'Yes' : 'No'}
        />
      </DetailsGroup>
    </div>
  );
}

function DetailsGroup({ title, children }) {
  return (
    <div className="mt-5 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-black text-slate-950">{title}</h4>
      <div className="mt-4 grid grid-cols-1 gap-3">{children}</div>
    </div>
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
      className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${
        type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="break-words text-right font-black text-slate-900">
        {value || '-'}
      </span>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-900">
        {value || '-'}
      </p>
    </div>
  );
}

function PanelMessage({ message }) {
  return (
    <div className="mt-4 rounded-[26px] border border-white bg-white p-6 text-sm font-semibold text-slate-500 shadow-lg shadow-slate-200/70">
      {message}
    </div>
  );
}