import { useEffect, useState } from 'react';
import {
  getMyProfileDetails,
  updateMyProfileDetails,
} from '../../services/profileService';

const initialForm = {
  contactNumber: '',
  academicSession: '',
  presentAddress: '',
  permanentAddress: '',
  currentCompany: '',
  designation: '',
  showEmail: false,
  showContactNumber: false,
  contactVisibility: 'private',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState({
    type: '',
    message: '',
  });

  const isStudent = profile?.role === 'student';
  const isAlumni = profile?.role === 'alumni';
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await getMyProfileDetails();

      setProfile(data);

      setForm({
        contactNumber: data.contact_number || '',
        academicSession: data.academic_session || '',
        presentAddress: data.present_address || '',
        permanentAddress: data.permanent_address || '',
        currentCompany: data.current_company || '',
        designation: data.designation || '',
        showEmail: Boolean(data.show_email),
        showContactNumber: Boolean(data.show_contact_number),
        contactVisibility: data.contact_visibility || 'private',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load profile.',
      });
    } finally {
      setLoading(false);
    }
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await updateMyProfileDetails(form);

      setStatus({
        type: 'success',
        message: result.message || 'Profile updated successfully.',
      });

      await loadProfile();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Profile update failed.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Loading profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You can edit your contact, address, session and visibility
              settings. Roster/verification fields are locked.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProfile}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        {isAdmin ? (
          <AdminProfile profile={profile} />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Locked Information
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                These fields are used for verification and cannot be edited from
                profile page.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <ReadonlyItem label="Email" value={profile.email} />
                <ReadonlyItem label="Role" value={profile.role} />
                <ReadonlyItem
                  label="Verified"
                  value={profile.is_verified ? 'Yes' : 'No'}
                />

                {isStudent ? (
                  <>
                    <ReadonlyItem
                      label="Roll Number"
                      value={profile.roll_number}
                    />
                    <ReadonlyItem
                      label="Department"
                      value={profile.department_name}
                    />
                    <ReadonlyItem
                      label="Current Semester"
                      value={profile.current_semester}
                    />
                  </>
                ) : null}

                {isAlumni ? (
                  <>
                    <ReadonlyItem
                      label="Registration No"
                      value={profile.registration_no}
                    />
                    <ReadonlyItem
                      label="Graduation Year"
                      value={profile.graduation_year}
                    />
                    <ReadonlyItem label="Batch" value={profile.batch} />
                    <ReadonlyItem
                      label="Certificate"
                      value={profile.verification_doc_url || 'Uploaded/Pending'}
                    />
                  </>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Editable Information
              </h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput
                    label="Contact Number"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={updateField}
                    placeholder="01XXXXXXXXX"
                  />

                  <TextInput
                    label="Academic Session"
                    name="academicSession"
                    value={form.academicSession}
                    onChange={updateField}
                    placeholder="2023-24"
                  />

                  <TextInput
                    label="Present Address"
                    name="presentAddress"
                    value={form.presentAddress}
                    onChange={updateField}
                    placeholder="Current address"
                  />

                  <TextInput
                    label="Permanent Address"
                    name="permanentAddress"
                    value={form.permanentAddress}
                    onChange={updateField}
                    placeholder="Permanent address"
                  />

                  {isAlumni ? (
                    <>
                      <TextInput
                        label="Current Company"
                        name="currentCompany"
                        value={form.currentCompany}
                        onChange={updateField}
                        placeholder="Company name"
                      />

                      <TextInput
                        label="Designation"
                        name="designation"
                        value={form.designation}
                        onChange={updateField}
                        placeholder="Software Engineer"
                      />
                    </>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-bold text-slate-950">
                    Directory Visibility
                  </h3>

                  <div className="mt-4 space-y-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.showEmail}
                        onChange={(event) =>
                          updateField('showEmail', event.target.checked)
                        }
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        Show my email to verified directory members
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.showContactNumber}
                        onChange={(event) =>
                          updateField('showContactNumber', event.target.checked)
                        }
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
                      />

                      <span className="text-sm font-semibold text-slate-700">
                        Show my contact number according to visibility rule
                      </span>
                    </label>

                    <SelectInput
                      label="Contact Visibility"
                      name="contactVisibility"
                      value={form.contactVisibility}
                      onChange={updateField}
                      options={[
                        { label: 'Private', value: 'private' },
                        {
                          label: 'Verified Members',
                          value: 'verified_members',
                        },
                        { label: 'Students Only', value: 'students_only' },
                        { label: 'Alumni Only', value: 'alumni_only' },
                        {
                          label: 'Public To Directory',
                          value: 'public_to_directory',
                        },
                      ]}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function AdminProfile({ profile }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="text-xl font-bold text-slate-950">Admin Profile</h2>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReadonlyItem label="Email" value={profile.email} />
        <ReadonlyItem label="Role" value={profile.role} />
        <ReadonlyItem
          label="Verified"
          value={profile.is_verified ? 'Yes' : 'No'}
        />
      </div>
    </section>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value || ''}
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
        value={value || 'private'}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadonlyItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-900">
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