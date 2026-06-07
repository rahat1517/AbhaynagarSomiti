import { useEffect, useState } from 'react';
import {
  deleteAcademicRoster,
  listAcademicRoster,
  saveAcademicRoster,
} from '../../services/rosterService';
import { supabase } from '../../lib/supabaseClient';

const initialFilters = {
  searchText: '',
  departmentName: '',
  academicSession: '',
  isActive: '',
};

const initialForm = {
  id: '',
  rollNumber: '',
  email: '',
  fullName: '',
  departmentName: '',
  currentSemester: '',
  academicSession: '',
  isActive: true,
};

export default function AdminRosterPage() {
  const [adminProfile, setAdminProfile] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [roster, setRoster] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState({
    type: '',
    message: '',
  });

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const profile = await getCurrentProfile();

      if (profile.role !== 'admin') {
        throw new Error('Admin access required.');
      }

      setAdminProfile(profile);

      const data = await listAcademicRoster(initialFilters);
      setRoster(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load roster page.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error('Login required.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_verified')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function applyFilters() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await listAcademicRoster(filters);
      setRoster(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to filter roster.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function clearFilters() {
    setFilters(initialFilters);
    setLoading(true);

    try {
      const data = await listAcademicRoster(initialFilters);
      setRoster(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to reload roster.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      await saveAcademicRoster(form);

      setStatus({
        type: 'success',
        message: form.id
          ? 'Roster record updated successfully.'
          : 'Roster record added successfully.',
      });

      setForm(initialForm);

      const data = await listAcademicRoster(filters);
      setRoster(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to save roster.',
      });
    } finally {
      setSaving(false);
    }
  }

  function editRoster(item) {
    setForm({
      id: item.id,
      rollNumber: item.roll_number || '',
      email: item.email || '',
      fullName: item.full_name || '',
      departmentName: item.department_name || '',
      currentSemester: item.current_semester || '',
      academicSession: item.academic_session || '',
      isActive: Boolean(item.is_active),
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function removeRoster(item) {
    const confirmed = window.confirm(
      `Delete roster record for roll ${item.roll_number}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await deleteAcademicRoster(item.id);

      setStatus({
        type: 'success',
        message: result.message || 'Roster deleted successfully.',
      });

      const data = await listAcademicRoster(filters);
      setRoster(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to delete roster.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading && !adminProfile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Loading roster page...</p>
        </section>
      </main>
    );
  }

  if (status.type === 'error' && !adminProfile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-soft">
          <StatusBox type="error" message={status.message} />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Super Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Academic Roster Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Add, update, deactivate or delete official student roster records.
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              Logged in as {adminProfile?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={initializePage}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-xl font-bold text-slate-950">
              {form.id ? 'Edit Roster' : 'Add Roster'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <TextInput
                label="Roll Number"
                name="rollNumber"
                value={form.rollNumber}
                onChange={updateForm}
                required
              />

              <TextInput
                label="Student Email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                placeholder="student@example.com"
              />

              <TextInput
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={updateForm}
                required
              />

              <TextInput
                label="Department Name"
                name="departmentName"
                value={form.departmentName}
                onChange={updateForm}
                placeholder="cse"
                required
              />

              <TextInput
                label="Current Semester"
                name="currentSemester"
                type="number"
                min="1"
                max="12"
                value={form.currentSemester}
                onChange={updateForm}
                required
              />

              <TextInput
                label="Academic Session"
                name="academicSession"
                value={form.academicSession}
                onChange={updateForm}
                placeholder="2023-24"
                required
              />

              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 px-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm('isActive', event.target.checked)
                  }
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  Active student
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                >
                  {saving ? 'Saving...' : form.id ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </section>

          <section>
            <div className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Filter Roster
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <TextInput
                  label="Search"
                  name="searchText"
                  value={filters.searchText}
                  onChange={updateFilter}
                  placeholder="roll/name/email"
                />

                <TextInput
                  label="Department"
                  name="departmentName"
                  value={filters.departmentName}
                  onChange={updateFilter}
                  placeholder="cse"
                />

                <TextInput
                  label="Session"
                  name="academicSession"
                  value={filters.academicSession}
                  onChange={updateFilter}
                  placeholder="2023-24"
                />

                <SelectInput
                  label="Status"
                  name="isActive"
                  value={filters.isActive}
                  onChange={updateFilter}
                  options={[
                    { label: 'All', value: '' },
                    { label: 'Active', value: 'true' },
                    { label: 'Inactive', value: 'false' },
                  ]}
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Clear Filter
                </button>

                <button
                  type="button"
                  onClick={applyFilters}
                  className="min-h-12 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Apply Filter
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <PanelMessage message="Loading roster records..." />
              ) : null}

              {!loading && roster.length === 0 ? (
                <PanelMessage message="No roster records found." />
              ) : null}

              {roster.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl bg-white p-5 shadow-soft"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-950">
                          {item.full_name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.email || 'No email'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => editRoster(item)}
                        className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => removeRoster(item)}
                        className="min-h-12 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Roll" value={item.roll_number} />
                    <Info label="Department" value={item.department_name} />
                    <Info label="Semester" value={item.current_semester} />
                    <Info label="Session" value={item.academic_session} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  min,
  max,
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
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
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
        {options.map((item) => (
          <option key={item.value || 'all'} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }) {
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
    <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-soft">
      {message}
    </div>
  );
}