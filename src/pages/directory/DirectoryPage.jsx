import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getDirectoryProfileDetails,
  searchDirectoryProfiles,
} from '../../services/directoryService';
import { requestMentorship } from '../../services/mentorshipService';

const initialFilters = {
  role: '',
  searchText: '',
  departmentName: '',
  batch: '',
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

  const [mentorshipTopic, setMentorshipTopic] = useState('');
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [mentorshipLoading, setMentorshipLoading] = useState(false);

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
    setMentorshipTopic('');
    setMentorshipMessage('');
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

  async function handleMentorshipRequest(alumniId) {
    setMentorshipLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await requestMentorship({
        alumniId,
        topic: mentorshipTopic,
        message: mentorshipMessage,
      });

      setStatus({
        type: 'success',
        message: 'Mentorship request sent successfully.',
      });

      setMentorshipTopic('');
      setMentorshipMessage('');
      setIsProfileDrawerOpen(false);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to request mentorship.',
      });
    } finally {
      setMentorshipLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Directory
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Student & Alumni Directory
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Search verified students and alumni. Private contact information
              is shown only when visibility rules allow it.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="min-h-12 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white md:hidden"
          >
            Open Filters
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <aside className="hidden md:block">
            <div className="sticky top-5 rounded-3xl bg-white p-5 shadow-soft">
              <FilterPanel
                filters={filters}
                updateFilter={updateFilter}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
              />
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {profiles.length} profiles loaded
                </p>
                <p className="text-xs text-slate-500">
                  Scroll down to load more results.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadProfiles({ reset: true })}
                className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <PanelMessage message="Loading directory..." />
            ) : null}

            {!loading && profiles.length === 0 ? (
              <PanelMessage message="No matching verified profiles found." />
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
        mentorshipTopic={mentorshipTopic}
        setMentorshipTopic={setMentorshipTopic}
        mentorshipMessage={mentorshipMessage}
        setMentorshipMessage={setMentorshipMessage}
        mentorshipLoading={mentorshipLoading}
        onMentorshipRequest={handleMentorshipRequest}
      />
    </main>
  );
}

function FilterPanel({ filters, updateFilter, applyFilters, clearFilters }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-950">Filters</h2>
      <p className="mt-1 text-sm text-slate-500">Refine directory results.</p>

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
          placeholder="Company, batch, department..."
        />

        <TextInput
          label="Department"
          name="departmentName"
          value={filters.departmentName}
          onChange={updateFilter}
          placeholder="Computer Science"
        />

        <TextInput
          label="Batch"
          name="batch"
          value={filters.batch}
          onChange={updateFilter}
          placeholder="Batch 2018"
        />

        <TextInput
          label="Graduation Year"
          name="graduationYear"
          type="number"
          value={filters.graduationYear}
          onChange={updateFilter}
          placeholder="2024"
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

      <div className="mt-5 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={applyFilters}
          className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
      className="rounded-3xl bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
            {profile.role}
          </span>

          <h2 className="mt-3 text-lg font-bold text-slate-950">
            {isStudent ? profile.roll_number : profile.registration_no}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {profile.display_email || 'Email hidden'}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          Verified
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {isStudent ? (
          <>
            <InfoLine label="Department" value={profile.department_name} />
            <InfoLine label="Semester" value={profile.current_semester} />
          </>
        ) : (
          <>
            <InfoLine label="Batch" value={profile.batch} />
            <InfoLine label="Graduation" value={profile.graduation_year} />
            <InfoLine label="Company" value={profile.current_company} />
            <InfoLine label="Designation" value={profile.designation} />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 min-h-12 w-full rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        View Details
      </button>
    </article>
  );
}

function ProfileDetailsDrawer({
  open,
  onClose,
  loading,
  profile,
  mentorshipTopic,
  setMentorshipTopic,
  mentorshipMessage,
  setMentorshipMessage,
  mentorshipLoading,
  onMentorshipRequest,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute bottom-0 right-0 w-full rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 md:top-0 md:h-full md:max-w-md md:rounded-l-3xl md:rounded-t-none ${
          open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Profile Details
            </h2>
            <p className="text-sm text-slate-500">
              Privacy-aware contact view
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5 md:max-h-[calc(100vh-90px)]">
          {loading ? (
            <p className="text-sm text-slate-500">Loading profile...</p>
          ) : null}

          {!loading && !profile ? (
            <p className="text-sm text-slate-500">
              Select a profile to view details.
            </p>
          ) : null}

          {!loading && profile ? (
            <ProfileDetailsContent
              profile={profile}
              mentorshipTopic={mentorshipTopic}
              setMentorshipTopic={setMentorshipTopic}
              mentorshipMessage={mentorshipMessage}
              setMentorshipMessage={setMentorshipMessage}
              mentorshipLoading={mentorshipLoading}
              onMentorshipRequest={onMentorshipRequest}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ProfileDetailsContent({
  profile,
  mentorshipTopic,
  setMentorshipTopic,
  mentorshipMessage,
  setMentorshipMessage,
  mentorshipLoading,
  onMentorshipRequest,
}) {
  const isStudent = profile.role === 'student';
  const isAlumni = profile.role === 'alumni';

  return (
    <div>
      <div className="rounded-3xl bg-slate-50 p-5">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
          {profile.role}
        </span>

        <h3 className="mt-3 text-xl font-bold text-slate-950">
          {isStudent
            ? profile.roll_number
            : isAlumni
              ? profile.registration_no
              : profile.email}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Joined{' '}
          {profile.created_at
            ? new Date(profile.created_at).toLocaleDateString()
            : '-'}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <DetailItem label="Role" value={profile.role} />

        <DetailItem
          label="Verification Status"
          value={profile.is_verified ? 'Verified' : 'Not Verified'}
        />

        <DetailItem
          label="Email"
          value={profile.email || 'Hidden by privacy preference'}
        />

        <DetailItem
          label="Contact Number"
          value={profile.contact_number || 'Hidden by privacy preference'}
        />

        <DetailItem
          label="Academic Session"
          value={profile.academic_session}
        />

        <DetailItem
          label="Present Address"
          value={profile.present_address}
        />

        <DetailItem
          label="Permanent Address"
          value={profile.permanent_address}
        />

        {isStudent ? (
          <>
            <DetailItem label="Roll Number" value={profile.roll_number} />

            <DetailItem label="Department" value={profile.department_name} />

            <DetailItem
              label="Current Semester"
              value={profile.current_semester}
            />
          </>
        ) : null}

        {isAlumni ? (
          <>
            <DetailItem
              label="Registration No"
              value={profile.registration_no}
            />

            <DetailItem
              label="Graduation Year"
              value={profile.graduation_year}
            />

            <DetailItem label="Batch" value={profile.batch} />

            <DetailItem
              label="Current Company / Job Place"
              value={profile.current_company}
            />

            <DetailItem
              label="Current Job Position / Designation"
              value={profile.designation}
            />

            <DetailItem
              label="Verification Document"
              value={profile.verification_doc_url}
            />
          </>
        ) : null}
      </div>

      {isAlumni ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onMentorshipRequest(profile.profile_id);
          }}
          className="mt-5 rounded-3xl border border-slate-200 bg-white p-4"
        >
          <h4 className="text-sm font-bold text-slate-950">
            Request Mentorship
          </h4>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Topic
            </span>

            <input
              value={mentorshipTopic}
              required
              onChange={(event) => setMentorshipTopic(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Career guidance, CV review, interview prep..."
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Message
            </span>

            <textarea
              rows={5}
              value={mentorshipMessage}
              required
              minLength={20}
              onChange={(event) => setMentorshipMessage(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Write at least 20 characters explaining why you want mentorship..."
            />
          </label>

          <button
            type="submit"
            disabled={mentorshipLoading}
            className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
          >
            {mentorshipLoading ? 'Sending...' : 'Request Mentorship'}
          </button>
        </form>
      ) : null}
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
        className={`absolute inset-0 bg-slate-950/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">
            Directory Filters
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
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
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800">
        {value || '-'}
      </span>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
    <div className="mt-4 rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
      {message}
    </div>
  );
}