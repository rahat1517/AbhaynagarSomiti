import { useEffect, useState } from 'react';
import {
  createCareerPost,
  getMyCareerPostApplications,
  updateJobApplicationStatus,
} from '../../services/careerService';
import {
  getMyMentorshipRelations,
  respondToMentorshipRequest,
} from '../../services/mentorshipService';

const initialJobForm = {
  title: '',
  companyName: '',
  industryVertical: '',
  jobType: 'full_time',
  location: '',
  isRemote: false,
  description: '',
  requirements: '',
  applicationDeadline: '',
  externalApplyUrl: '',
};

export default function AlumniCareerDashboard() {
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [applications, setApplications] = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [activeTab, setActiveTab] = useState('post');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const [applicationData, mentorshipData] = await Promise.all([
        getMyCareerPostApplications(),
        getMyMentorshipRelations(),
      ]);

      setApplications(applicationData);
      setMentorships(mentorshipData);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  }

  function updateJobField(name, value) {
    setJobForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateJob(event) {
    event.preventDefault();

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await createCareerPost(jobForm);

      setJobForm(initialJobForm);
      setStatus({
        type: 'success',
        message: 'Vacancy posted successfully.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to post vacancy.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApplicationStatus(applicationId, nextStatus) {
    setActionLoadingId(applicationId);
    setStatus({ type: '', message: '' });

    try {
      await updateJobApplicationStatus({
        applicationId,
        status: nextStatus,
      });

      setStatus({
        type: 'success',
        message: 'Application status updated.',
      });

      await loadDashboardData();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to update application.',
      });
    } finally {
      setActionLoadingId('');
    }
  }

  async function handleMentorshipResponse(relationId, nextStatus) {
    setActionLoadingId(relationId);
    setStatus({ type: '', message: '' });

    try {
      await respondToMentorshipRequest({
        relationId,
        status: nextStatus,
      });

      setStatus({
        type: 'success',
        message: 'Mentorship request updated.',
      });

      await loadDashboardData();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to update mentorship request.',
      });
    } finally {
      setActionLoadingId('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Alumni Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Career & Mentorship
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Post vacancies, review student applications, and respond to
              mentorship requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 grid grid-cols-3 rounded-2xl bg-slate-200 p-1 md:max-w-xl">
          <TabButton
            active={activeTab === 'post'}
            onClick={() => setActiveTab('post')}
          >
            Post
          </TabButton>

          <TabButton
            active={activeTab === 'applications'}
            onClick={() => setActiveTab('applications')}
          >
            Applications
          </TabButton>

          <TabButton
            active={activeTab === 'mentorship'}
            onClick={() => setActiveTab('mentorship')}
          >
            Mentorship
          </TabButton>
        </div>

        {activeTab === 'post' ? (
          <JobPostForm
            form={jobForm}
            loading={loading}
            updateField={updateJobField}
            onSubmit={handleCreateJob}
          />
        ) : null}

        {activeTab === 'applications' ? (
          <ApplicationsList
            applications={applications}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onUpdateStatus={handleApplicationStatus}
          />
        ) : null}

        {activeTab === 'mentorship' ? (
          <MentorshipList
            mentorships={mentorships}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onRespond={handleMentorshipResponse}
          />
        ) : null}
      </section>
    </main>
  );
}

function JobPostForm({ form, loading, updateField, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-3xl bg-white p-5 shadow-soft md:p-8"
    >
      <h2 className="text-xl font-bold text-slate-950">Post a Vacancy</h2>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextInput
          label="Job Title"
          name="title"
          value={form.title}
          onChange={updateField}
          required
        />

        <TextInput
          label="Company Name"
          name="companyName"
          value={form.companyName}
          onChange={updateField}
          required
        />

        <TextInput
          label="Industry Vertical"
          name="industryVertical"
          value={form.industryVertical}
          onChange={updateField}
          placeholder="Software, Banking, Textile..."
          required
        />

        <SelectInput
          label="Job Type"
          name="jobType"
          value={form.jobType}
          onChange={updateField}
          options={[
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
          value={form.location}
          onChange={updateField}
          required
        />

        <TextInput
          label="Application Deadline"
          name="applicationDeadline"
          type="date"
          value={form.applicationDeadline}
          onChange={updateField}
        />

        <TextInput
          label="External Apply URL"
          name="externalApplyUrl"
          value={form.externalApplyUrl}
          onChange={updateField}
          placeholder="https://..."
        />

        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-300 px-4">
          <input
            type="checkbox"
            checked={form.isRemote}
            onChange={(event) => updateField('isRemote', event.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600"
          />
          <span className="text-sm font-semibold text-slate-700">
            Remote available
          </span>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextArea
          label="Description"
          name="description"
          value={form.description}
          onChange={updateField}
          required
        />

        <TextArea
          label="Requirements"
          name="requirements"
          value={form.requirements}
          onChange={updateField}
          required
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="min-h-12 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {loading ? 'Posting...' : 'Publish Vacancy'}
        </button>
      </div>
    </form>
  );
}

function ApplicationsList({
  applications,
  loading,
  actionLoadingId,
  onUpdateStatus,
}) {
  return (
    <section className="mt-6 space-y-4">
      {loading ? (
        <PanelMessage message="Loading applications..." />
      ) : null}

      {!loading && applications.length === 0 ? (
        <PanelMessage message="No applications found." />
      ) : null}

      {applications.map((application) => (
        <article
          key={application.application_id}
          className="rounded-3xl bg-white p-5 shadow-soft"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">
                  {application.job_title}
                </h2>
                <StatusBadge status={application.application_status} />
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {application.company_name}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoBox label="Roll" value={application.roll_number} />
                <InfoBox label="Department" value={application.department_name} />
                <InfoBox label="Semester" value={application.current_semester} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
              {['reviewed', 'shortlisted', 'rejected', 'accepted'].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={actionLoadingId === application.application_id}
                    onClick={() =>
                      onUpdateStatus(application.application_id, status)
                    }
                    className="min-h-12 rounded-2xl border border-slate-300 px-3 text-xs font-bold capitalize text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cover Message
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {application.cover_message}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function MentorshipList({ mentorships, loading, actionLoadingId, onRespond }) {
  const received = mentorships.filter((item) => item.alumni_id);

  return (
    <section className="mt-6 space-y-4">
      {loading ? (
        <PanelMessage message="Loading mentorship requests..." />
      ) : null}

      {!loading && received.length === 0 ? (
        <PanelMessage message="No mentorship requests found." />
      ) : null}

      {received.map((item) => (
        <article
          key={item.relation_id}
          className="rounded-3xl bg-white p-5 shadow-soft"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">
                  {item.topic}
                </h2>
                <StatusBadge status={item.status} />
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {item.roll_number} · {item.department_name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:min-w-[260px]">
              <button
                type="button"
                disabled={
                  actionLoadingId === item.relation_id ||
                  item.status !== 'pending'
                }
                onClick={() => onRespond(item.relation_id, 'rejected')}
                className="min-h-12 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                disabled={
                  actionLoadingId === item.relation_id ||
                  item.status !== 'pending'
                }
                onClick={() => onRespond(item.relation_id, 'accepted')}
                className="min-h-12 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:bg-emerald-300"
              >
                Accept
              </button>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {item.message}
          </p>
        </article>
      ))}
    </section>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-xl px-4 text-sm font-bold transition ${
        active
          ? 'bg-white text-slate-950 shadow'
          : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = '',
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextArea({ label, name, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <textarea
        rows={6}
        value={value}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
          <option key={option.value} value={option.value}>
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

function StatusBadge({ status }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
      {String(status || '').replaceAll('_', ' ')}
    </span>
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

function PanelMessage({ message }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
      {message}
    </div>
  );
}
