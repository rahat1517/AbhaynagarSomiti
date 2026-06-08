import { useEffect, useMemo, useState } from 'react';
import {
  getMyProfileDetails,
  requestMyProfilePhotoUpdate,
  requestMyProfileUpdate,
  requestMyUniversityDocumentUpdate,
} from '../../services/profileService';

const hallOptions = [
  'Ruqayyah Hall',
  'Bangamata Sheikh Fazilatunnesa Mujib Hall',
  'Shamsun Nahar Hall',
  'Bangladesh-Kuwait Maitree Hall',
  'Kabi Sufia Kamal Hall',
  'Dr. Muhammad Shahidullah Hall',
  'Fazlul Huq Muslim Hall',
  'Amar Ekushey Hall',
  'Salimullah Muslim Hall',
  'Jagannath Hall',
  'Shahid Sergeant Zahurul Haque Hall',
  'Surja Sen Hall',
  'Haji Muhammad Mohsin Hall',
  'Kabi Jasimuddin Hall',
  'A.F. Rahman Hall',
  'Muktijoddha Ziaur Rahman Hall',
  'Sheikh Mujibur Rahman Hall',
  'Bijoy Ekattor Hall',
  'IBA Hostel',
  'Other',
];

const unionOptions = [
  'Sreedharpur Union',
  'Prembag Union',
  'Baghutia Union',
  'Subha Para Union',
  'Siddhipasha Union',
  'Sundoli Union',
  'Noapara Paurashava',
  'Chalishia Union',
  'Payra Union',
  'Other',
];

const genderOptions = ['Male', 'Female', 'Other'];

const bloodGroupOptions = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

const occupationOptions = [
  'Student',
  'Alumni',
  'Service Holder',
  'Business',
  'Teacher',
  'Banker',
  'Doctor',
  'Engineer',
  'Lawyer',
  'Freelancer',
  'Unemployed',
  'Other',
];

const degreeOptions = [
  'Secondary',
  'Higher Secondary',
  'Bachelor',
  'Masters',
  'BBA',
  'MBA',
  'BA',
  'MA',
  'BSS',
  'MSS',
  'BSc',
  'MSc',
  'LLB',
  'LLM',
  'PhD',
  'Other',
];

const emptyQualification = {
  degree_name: '',
  institution_name: '',
  passing_year: '',
  subject_department: '',
  academic_degree_name: '',
  gpa: '',
};

const initialForm = {
  fullName: '',
  nickName: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',

  contactNumber: '',
  facebookProfileLink: '',

  universityHallName: '',
  firstYearAdmissionSession: '',
  universitySubject: '',

  academicQualifications: [],

  unionPouroshovaName: '',
  wardVillageName: '',
  paraMohollaName: '',

  presentAddress: '',

  occupation: 'Student',
  professionalDetails: '',

  lifeStory: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

  const [status, setStatus] = useState({
    type: '',
    message: '',
  });

  const isAdmin = profile?.role === 'admin';

  const isStudentOccupation = useMemo(
    () => form.occupation?.toLowerCase() === 'student',
    [form.occupation]
  );

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (isStudentOccupation && form.professionalDetails) {
      updateField('professionalDetails', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudentOccupation]);

  async function loadProfile() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await getMyProfileDetails();

      setProfile(data);

      setForm({
        fullName: data.full_name || '',
        nickName: data.nick_name || '',
        dateOfBirth: data.date_of_birth || '',
        gender: data.gender || '',
        bloodGroup: data.blood_group || '',

        contactNumber: data.contact_number || '',
        facebookProfileLink: data.facebook_profile_link || '',

        universityHallName: data.university_hall_name || '',
        firstYearAdmissionSession: data.first_year_admission_session || '',
        universitySubject: data.university_subject || '',

        academicQualifications:
          Array.isArray(data.academic_qualifications) &&
          data.academic_qualifications.length > 0
            ? data.academic_qualifications
            : [{ ...emptyQualification }],

        unionPouroshovaName: data.union_pouroshova_name || '',
        wardVillageName: data.ward_village_name || '',
        paraMohollaName: data.para_moholla_name || '',

        presentAddress: data.present_address || '',

        occupation: data.occupation || 'Student',
        professionalDetails: data.professional_details || '',

        lifeStory: data.life_story || '',
      });
    } catch (error) {
      setProfile(null);

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

  function updateQualification(index, name, value) {
    setForm((current) => ({
      ...current,
      academicQualifications: current.academicQualifications.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [name]: value,
              }
            : item
      ),
    }));
  }

  function addQualification() {
    setForm((current) => ({
      ...current,
      academicQualifications: [
        ...current.academicQualifications,
        { ...emptyQualification },
      ],
    }));
  }

  function removeQualification(index) {
    setForm((current) => {
      if (current.academicQualifications.length === 1) return current;

      return {
        ...current,
        academicQualifications: current.academicQualifications.filter(
          (_item, itemIndex) => itemIndex !== index
        ),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const finalForm = {
        ...form,
        professionalDetails: isStudentOccupation ? '' : form.professionalDetails,
      };

      const result = await requestMyProfileUpdate(finalForm);

      setStatus({
        type: 'success',
        message:
          result?.message ||
          'Update request submitted. Admin approval is required.',
      });

      await loadProfile();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Profile update request failed.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoUploading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await requestMyProfilePhotoUpdate(file);

      setStatus({
        type: 'success',
        message:
          result?.message ||
          'Photo update request submitted. Admin approval is required.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to request photo update.',
      });
    } finally {
      setPhotoUploading(false);
      event.target.value = '';
    }
  }

  async function handleUniversityDocumentChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setDocumentUploading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await requestMyUniversityDocumentUpdate(file);

      setStatus({
        type: 'success',
        message:
          result?.message ||
          'University document update request submitted. Admin approval is required.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to request document update.',
      });
    } finally {
      setDocumentUploading(false);
      event.target.value = '';
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Loading profile...</p>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-bold text-slate-950">
            Profile not found
          </h1>

          {status.message ? (
            <StatusBox type={status.type} message={status.message} />
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Your auth account exists, but your profile information was not
              created.
            </p>
          )}

          <button
            type="button"
            onClick={loadProfile}
            className="mt-5 min-h-12 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-soft">
          <ProfileHeader
            profile={profile}
            onPhotoChange={handlePhotoChange}
            photoUploading={photoUploading}
          />

          <h1 className="mt-6 text-2xl font-bold text-slate-950">
            Admin Profile
          </h1>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReadonlyItem label="Full Name" value={profile.full_name} />
            <ReadonlyItem label="Email" value={profile.email} />
            <ReadonlyItem label="Role" value={profile.role} />
            <ReadonlyItem
              label="Verified"
              value={profile.is_verified ? 'Yes' : 'No'}
            />
          </div>
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
              Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              You can edit all profile information. Changes will be applied only
              after admin approval.
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

        <div className="profile-mobile-stack mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[0.75fr_1.45fr] lg:gap-6">
          <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
            <ProfileHeader
              profile={profile}
              onPhotoChange={handlePhotoChange}
              photoUploading={photoUploading}
            />

            <div className="mt-5">
              <label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                {documentUploading
                  ? 'Uploading...'
                  : 'Change University Document'}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleUniversityDocumentChange}
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs text-slate-500">
                Document update also requires admin approval.
              </p>
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-950">
              Current Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <ReadonlyItem label="Email" value={profile.email} />
              <ReadonlyItem label="Role" value={profile.role} />
              <ReadonlyItem
                label="Verified"
                value={profile.is_verified ? 'Yes' : 'No'}
              />
              <ReadonlyItem
                label="University Document"
                value={
                  profile.university_document_url
                    ? 'Uploaded'
                    : 'Not uploaded'
                }
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Editable Information
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <FormSection title="Basic Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                  />

                  <TextInput
                    label="Nick Name"
                    name="nickName"
                    value={form.nickName}
                    onChange={updateField}
                  />

                  <TextInput
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={updateField}
                  />

                  <SelectInput
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={updateField}
                    options={genderOptions}
                    placeholder="Select gender"
                  />

                  <SelectInput
                    label="Blood Group"
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={updateField}
                    options={bloodGroupOptions}
                    placeholder="Select blood group"
                  />

                  <TextInput
                    label="Mobile Number"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={updateField}
                    placeholder="01XXXXXXXXX"
                  />

                  <TextInput
                    label="Facebook Profile Link"
                    name="facebookProfileLink"
                    value={form.facebookProfileLink}
                    onChange={updateField}
                  />
                </div>
              </FormSection>

              <FormSection title="University Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectInput
                    label="University Hall Name"
                    name="universityHallName"
                    value={form.universityHallName}
                    onChange={updateField}
                    options={hallOptions}
                    placeholder="Select hall"
                  />

                  <TextInput
                    label="University First Year Admission Session"
                    name="firstYearAdmissionSession"
                    value={form.firstYearAdmissionSession}
                    onChange={updateField}
                    placeholder="2022-23"
                  />

                  <TextInput
                    label="University Subject / Department"
                    name="universitySubject"
                    value={form.universitySubject}
                    onChange={updateField}
                    placeholder="Software Engineering"
                  />
                </div>
              </FormSection>

              <FormSection title="Academic Qualification">
                <div className="space-y-4">
                  {form.academicQualifications.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-900">
                          Qualification {index + 1}
                        </h4>

                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          disabled={form.academicQualifications.length === 1}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectInput
                          label="Degree Name"
                          name="degree_name"
                          value={item.degree_name}
                          onChange={(name, value) =>
                            updateQualification(index, name, value)
                          }
                          options={degreeOptions}
                          placeholder="Select degree"
                        />

                        <TextInput
                          label="Institution Name"
                          name="institution_name"
                          value={item.institution_name}
                          onChange={(name, value) =>
                            updateQualification(index, name, value)
                          }
                        />

                        <TextInput
                          label="Passing Year"
                          name="passing_year"
                          value={item.passing_year}
                          onChange={(name, value) =>
                            updateQualification(index, name, value)
                          }
                        />

                        <TextInput
                          label="Subject / Group / Department"
                          name="subject_department"
                          value={item.subject_department}
                          onChange={(name, value) =>
                            updateQualification(index, name, value)
                          }
                        />

                        <TextInput
                          label="Academic Degree Name"
                          name="academic_degree_name"
                          value={item.academic_degree_name}
                          onChange={(name, value) =>
                            updateQualification(index, name, value)
                          }
                          placeholder="SSC / HSC / BBA / MBA"
                        />

                        <TextInput
                          label="GPA"
                          name="gpa"
                          value={item.gpa}
                          onChange={(name, value) =>
                            updateQualification(index, name, value)
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addQualification}
                    className="min-h-12 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    + Add Qualification
                  </button>
                </div>
              </FormSection>

              <FormSection title="Address in Abhaynagar">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <SelectInput
                    label="Union / Pouroshova Name"
                    name="unionPouroshovaName"
                    value={form.unionPouroshovaName}
                    onChange={updateField}
                    options={unionOptions}
                    placeholder="Select union/pouroshova"
                  />

                  <TextInput
                    label="Ward / Village Name"
                    name="wardVillageName"
                    value={form.wardVillageName}
                    onChange={updateField}
                  />

                  <TextInput
                    label="Para / Moholla Name"
                    name="paraMohollaName"
                    value={form.paraMohollaName}
                    onChange={updateField}
                  />
                </div>
              </FormSection>

              <FormSection title="Present Address">
                <TextArea
                  label="Present Address"
                  name="presentAddress"
                  value={form.presentAddress}
                  onChange={updateField}
                />
              </FormSection>

              <FormSection title="Occupation">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Occupation"
                    name="occupation"
                    value={form.occupation}
                    onChange={updateField}
                    options={occupationOptions}
                  />

                  <TextArea
                    label="Professional Details"
                    name="professionalDetails"
                    value={form.professionalDetails}
                    onChange={updateField}
                    disabled={isStudentOccupation}
                    placeholder={
                      isStudentOccupation
                        ? 'Disabled for students'
                        : 'Write job/professional details'
                    }
                  />
                </div>
              </FormSection>

              <FormSection title="Memories and Stories">
                <TextArea
                  label="Life Story"
                  name="lifeStory"
                  value={form.lifeStory}
                  onChange={updateField}
                  rows={5}
                />
              </FormSection>

              <div className="sticky bottom-0 z-20 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {saving ? 'Submitting Request...' : 'Submit Update Request'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function ProfileHeader({ profile, onPhotoChange, photoUploading }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-24 w-24 overflow-hidden rounded-3xl bg-slate-200">
          {profile.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name || profile.email || 'Profile'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-400">
              {(profile.full_name || profile.email || '?')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-950">
            {profile.full_name || profile.email}
          </h2>

          <p className="mt-1 text-sm font-semibold capitalize text-slate-500">
            {profile.occupation || profile.role}
          </p>

          <div className="mt-4">
            <label className="inline-flex cursor-pointer items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
              {photoUploading ? 'Uploading...' : 'Change Photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoChange}
                className="hidden"
              />
            </label>

            <p className="mt-2 text-xs text-slate-500">
              Photo update requires admin approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-3 sm:p-4 md:p-5">
      <h3 className="mb-3 text-base font-bold text-slate-900 sm:mb-4">
        {title}
      </h3>
      {children}
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
  disabled = false,
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
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  rows = 4,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value || ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = '',
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value || ''}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
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