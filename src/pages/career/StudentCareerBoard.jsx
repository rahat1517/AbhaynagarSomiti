import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyToCareerPost,
  searchCareerPosts,
} from '../../services/careerService';

const initialFilters = {
  searchText: '',
  industryVertical: '',
  jobType: '',
  location: '',
};

export default function StudentCareerBoard() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverMessage, setCoverMessage] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [applyDrawerOpen, setApplyDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const observerRef = useRef(null);
  const lastItemRef = useRef(null);

  const lastCursor = useMemo(() => {
    if (jobs.length === 0) return null;
    return jobs[jobs.length - 1];
  }, [jobs]);

  const loadJobs = useCallback(
    async ({ reset = false } = {}) => {
      const activeFilters = reset ? filters : appliedFilters;

      if (reset) {
        setLoading(true);
        setJobs([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      setStatus({ type: '', message: '' });

      try {
        const data = await searchCareerPosts({
          filters: activeFilters,
          cursor: reset ? null : lastCursor,
          limit: 20,
        });

        setJobs((current) => {
          if (reset) return data;

          const existingIds = new Set(current.map((item) => item.id));
          const uniqueNext = data.filter((item) => !existingIds.has(item.id));

          return [...current, ...uniqueNext];
        });

        setHasMore(data.length === 20);
      } catch (error) {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to load jobs.',
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [appliedFilters, filters, lastCursor]
  );

  useEffect(() => {
    loadJobs({ reset: true });
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
        loadJobs({ reset: false });
      }
    });

    observerRef.current.observe(lastItemRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [jobs, hasMore, loadingMore, loading, loadJobs]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function applyFilters() {
    const nextFilters = { ...filters };
    setAppliedFilters(nextFilters);
    setFilterOpen(false);

    loadJobsWithFilters(nextFilters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);

    loadJobsWithFilters(initialFilters);
  }

  async function loadJobsWithFilters(nextFilters) {
    setLoading(true);
    setJobs([]);
    setHasMore(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await searchCareerPosts({
        filters: nextFilters,
        cursor: null,
        limit: 20,
      });

      setJobs(data);
      setHasMore(data.length === 20);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load jobs.',
      });
    } finally {
      setLoading(false);
    }
  }

  function openApplication(job) {
    setSelectedJob(job);
    setCoverMessage('');
    setResumeUrl('');
    setApplyDrawerOpen(true);
  }

  async function submitApplication(event) {
    event.preventDefault();

    if (!selectedJob) return;

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await applyToCareerPost({
        careerPostId: selectedJob.id,
        coverMessage,
        resumeUrl,
      });

      setStatus({
        type: 'success',
        message: 'Application submitted successfully.',
      });

      setApplyDrawerOpen(false);
      await loadJobs({ reset: true });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to submit application.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Career Board
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Jobs for Students
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Browse alumni-posted opportunities and apply directly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="min-h-12 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white md:hidden"
          >
            Filters
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
            {loading ? <PanelMessage message="Loading jobs..." /> : null}

            {!loading && jobs.length === 0 ? (
              <PanelMessage message="No jobs found." />
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {jobs.map((job, index) => {
                const isLast = index === jobs.length - 1;

                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    refProp={isLast ? lastItemRef : null}
                    onApply={() => openApplication(job)}
                  />
                );
              })}
            </div>

            {loadingMore ? (
              <PanelMessage message="Loading more jobs..." />
            ) : null}
          </section>
        </div>
      </section>

      <MobileDrawer open={filterOpen} onClose={() => setFilterOpen(false)}>
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
        />
      </MobileDrawer>

      <ApplicationDrawer
        open={applyDrawerOpen}
        onClose={() => setApplyDrawerOpen(false)}
        selectedJob={selectedJob}
        coverMessage={coverMessage}
        setCoverMessage={setCoverMessage}
        resumeUrl={resumeUrl}
        setResumeUrl={setResumeUrl}
        submitting={submitting}
        onSubmit={submitApplication}
      />
    </main>
  );
}

function JobCard({ job, onApply, refProp }) {
  return (
    <article ref={refProp} className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{job.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {job.company_name}
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
          {String(job.job_type || '').replaceAll('_', ' ')}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoBox label="Industry" value={job.industry_vertical} />
        <InfoBox
          label="Location"
          value={job.is_remote ? 'Remote' : job.location}
        />
        <InfoBox label="Deadline" value={job.application_deadline || 'Open'} />
        <InfoBox label="Applied" value={job.already_applied ? 'Yes' : 'No'} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
        {job.description}
      </p>

      <button
        type="button"
        disabled={job.already_applied}
        onClick={onApply}
        className="mt-5 min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {job.already_applied ? 'Already Applied' : 'Apply Now'}
      </button>
    </article>
  );
}

function ApplicationDrawer({
  open,
  onClose,
  selectedJob,
  coverMessage,
  setCoverMessage,
  resumeUrl,
  setResumeUrl,
  submitting,
  onSubmit,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 ${
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
        className={`absolute bottom-0 right-0 w-full rounded-t-3xl bg-white p-5 shadow-2xl transition-transform md:top-0 md:h-full md:max-w-md md:rounded-l-3xl md:rounded-t-none ${
          open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Apply to Job</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedJob?.title || 'Selected job'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl border border-slate-300 px-4 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Cover Message *
            </span>

            <textarea
              rows={8}
              value={coverMessage}
              required
              minLength={20}
              onChange={(event) => setCoverMessage(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Explain why you are interested and suitable..."
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Resume URL
            </span>

            <input
              type="url"
              value={resumeUrl}
              onChange={(event) => setResumeUrl(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="https://..."
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </aside>
    </div>
  );
}

function FilterPanel({ filters, updateFilter, applyFilters, clearFilters }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-950">Filters</h2>

      <div className="mt-5 space-y-4">
        <TextInput
          label="Search"
          name="searchText"
          value={filters.searchText}
          onChange={updateFilter}
          placeholder="Job, company..."
        />

        <TextInput
          label="Industry"
          name="industryVertical"
          value={filters.industryVertical}
          onChange={updateFilter}
        />

        <SelectInput
          label="Job Type"
          name="jobType"
          value={filters.jobType}
          onChange={updateFilter}
          options={[
            { label: 'All', value: '' },
            { label: 'Full-time', value: 'full_time' },
            { label: 'Part-time', value: 'part_time' },
            { label: 'Internship', value: 'internship' },
            { label: 'Contract', value: 'contract' },
            { label: 'Remote', value: 'remote' },
          ]}
        />

        <TextInput
          label="Location"
          name="location"
          value={filters.location}
          onChange={updateFilter}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={applyFilters}
          className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function MobileDrawer({ open, onClose, children }) {
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
        className={`absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Filters</h2>

          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl border border-slate-300 px-4 text-sm font-semibold"
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
        className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value || '-'}</p>
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
    <div className="mt-4 rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
      {message}
    </div>
  );
}