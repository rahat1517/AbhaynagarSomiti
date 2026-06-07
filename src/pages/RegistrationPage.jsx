import { useMemo, useState } from 'react';
import { registerAssociationUser } from '../services/registrationService';

const initialForm = {
  role: 'student',

  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  contactNumber: '',
  pdpoConsent: false,

  profilePhotoFile: null,

  academicSession: '',
  presentAddress: '',
  permanentAddress: '',

  rollNumber: '',
  departmentName: '',
  currentSemester: '',

  registrationNo: '',
  graduationYear: '',
  hall: '',
  currentCompany: '',
  designation: '',
  universityDocumentFile: null,
};

export default function RegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const isStudent = form.role === 'student';
  const isAlumni = form.role === 'alumni';

  const title = useMemo(
    () => (isStudent ? 'Student Registration' : 'Alumni Registration'),
    [isStudent]
  );

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleRoleChange(nextRole) {
    setStatus({ type: '', message: '' });

    setForm((current) => ({
      ...initialForm,
      role: nextRole,
      fullName: current.fullName,
      email: current.email,
      password: current.password,
      confirmPassword: current.confirmPassword,
      contactNumber: current.contactNumber,
      pdpoConsent: current.pdpoConsent,
      profilePhotoFile: current.profilePhotoFile,
      academicSession: current.academicSession,
      presentAddress: current.presentAddress,
      permanentAddress: current.permanentAddress,
      departmentName: current.departmentName,
    }));
  }

  async function handleRegistrationSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await registerAssociationUser(form);

      setStatus({
        type: 'success',
        message: result.message,
      });

      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Registration failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
        <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-soft md:p-8 lg:sticky lg:top-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Association Portal
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            Secure Student-Alumni Registration
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
            Students are verified against roster. Alumni submit any university
            document for admin approval. Everyone must upload a profile photo.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3">
            <InfoCard label="Student" value="Roster-based verification" />
            <InfoCard label="Alumni" value="University document review" />
            <InfoCard
              label="Public View"
              value="Photo, name, department, session"
            />
          </div>
        </aside>

        <section className="rounded-3xl bg-white p-4 shadow-soft sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill all required information.
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`min-h-12 rounded-xl px-4 text-sm font-semibold ${
                  isStudent
                    ? 'bg-white text-slate-950 shadow'
                    : 'text-slate-500'
                }`}
              >
                Student
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('alumni')}
                className={`min-h-12 rounded-xl px-4 text-sm font-semibold ${
                  isAlumni
                    ? 'bg-white text-slate-950 shadow'
                    : 'text-slate-500'
                }`}
              >
                Alumni
              </button>
            </div>
          </div>

          {status.message ? (
            <StatusBox type={status.type} message={status.message} />
          ) : null}

          <form onSubmit={handleRegistrationSubmit} className="mt-6 space-y-6">
            <FormSection title="Account Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  placeholder="Your full name"
                  required
                />

                <TextInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  required
                />

                <TextInput
                  label="Contact Number"
                  name="contactNumber"
                  type="tel"
                  value={form.contactNumber}
                  onChange={updateField}
                  placeholder="01XXXXXXXXX"
                  required
                />

                <TextInput
                  label="Department Name"
                  name="departmentName"
                  value={form.departmentName}
                  onChange={updateField}
                  placeholder="cse"
                  required
                />

                <FileInput
                  label="Profile Photo"
                  name="profilePhotoFile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={updateField}
                  required
                />

                <TextInput
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  required
                />

                <TextInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={updateField}
                  required
                />
              </div>
            </FormSection>

            <FormSection title="Address & Session">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput
                  label="Academic Session"
                  name="academicSession"
                  value={form.academicSession}
                  onChange={updateField}
                  placeholder="2020-21"
                  required
                />

                <TextInput
                  label="Present Address"
                  name="presentAddress"
                  value={form.presentAddress}
                  onChange={updateField}
                  placeholder="Current address"
                  required
                />

                <TextInput
                  label="Permanent Address"
                  name="permanentAddress"
                  value={form.permanentAddress}
                  onChange={updateField}
                  placeholder="Permanent address"
                  required
                />
              </div>
            </FormSection>

            {isStudent ? (
              <FormSection title="Student Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput
                    label="Roll Number"
                    name="rollNumber"
                    value={form.rollNumber}
                    onChange={updateField}
                    required
                  />

                  <TextInput
                    label="Current Semester"
                    name="currentSemester"
                    type="number"
                    min="1"
                    max="12"
                    value={form.currentSemester}
                    onChange={updateField}
                    required
                  />
                </div>
              </FormSection>
            ) : null}

            {isAlumni ? (
              <FormSection title="Alumni Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput
                    label="Registration Number"
                    name="registrationNo"
                    value={form.registrationNo}
                    onChange={updateField}
                    required
                  />

                  <TextInput
                    label="Graduation Year"
                    name="graduationYear"
                    type="number"
                    value={form.graduationYear}
                    onChange={updateField}
                    required
                  />

                  <TextInput
                    label="Hall"
                    name="hall"
                    value={form.hall}
                    onChange={updateField}
                    placeholder="Fazlul Huq Muslim Hall"
                    required
                  />

                  <TextInput
                    label="Current Company"
                    name="currentCompany"
                    value={form.currentCompany}
                    onChange={updateField}
                  />

                  <TextInput
                    label="Designation"
                    name="designation"
                    value={form.designation}
                    onChange={updateField}
                  />

                  <FileInput
                    label="Any University Document"
                    name="universityDocumentFile"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={updateField}
                    required
                  />
                </div>
              </FormSection>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.pdpoConsent}
                  onChange={(event) =>
                    updateField('pdpoConsent', event.target.checked)
                  }
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
                  required
                />

                <span className="text-sm leading-6 text-slate-700">
                  I agree that the portal may process my personal data for
                  registration, verification, directory, career and mentorship
                  services.
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setStatus({ type: '', message: '' });
                }}
                className="min-h-12 rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white disabled:bg-emerald-300"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
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

function FormSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4 md:p-5">
      <h3 className="mb-4 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </section>
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
        name={name}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function FileInput({ label, name, onChange, accept, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <input
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={(event) => onChange(name, event.target.files?.[0] || null)}
        className="block min-h-12 w-full rounded-2xl border border-slate-300 bg-white text-sm file:mr-4 file:min-h-12 file:border-0 file:bg-slate-900 file:px-4 file:text-sm file:font-semibold file:text-white"
      />
    </label>
  );
}