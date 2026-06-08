import { useEffect, useMemo, useState } from 'react';
import { registerAssociationUser } from '../services/registrationService';

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

const emptyDegreeQualification = {
  degreeName: '',
  institutionName: '',
  passingYear: '',
  subjectDepartment: '',
};

const initialForm = {
  fullName: '',
  nickName: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',

  email: '',
  password: '',
  confirmPassword: '',
  contactNumber: '',
  facebookProfileLink: '',

  profilePhotoFile: null,

  universityHallName: '',
  firstYearAdmissionSession: '',
  universitySubject: '',

  sscInstitutionName: '',
  sscGroup: '',
  sscPassingYear: '',
  sscGpa: '',

  hscInstitutionName: '',
  hscGroup: '',
  hscPassingYear: '',
  hscGpa: '',

  degreeQualifications: [
    {
      ...emptyDegreeQualification,
      degreeName: 'Bachelor',
    },
  ],

  unionPouroshovaName: '',
  wardVillageName: '',
  paraMohollaName: '',

  presentAddress: '',

  occupation: 'Student',
  professionalDetails: '',

  universityDocumentFile: null,
  lifeStory: '',

  pdpoConsent: false,
};

function isRunningDegree(degreeName) {
  return [
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
  ].includes(degreeName);
}

export default function RegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const isStudentOccupation = useMemo(
    () => form.occupation?.toLowerCase() === 'student',
    [form.occupation]
  );

  useEffect(() => {
    if (isStudentOccupation && form.professionalDetails) {
      updateField('professionalDetails', '');
    }

    if (isStudentOccupation) {
      setForm((current) => ({
        ...current,
        degreeQualifications: current.degreeQualifications.map((item) => ({
          ...item,
          passingYear: isRunningDegree(item.degreeName)
            ? item.passingYear || 'current student'
            : item.passingYear,
        })),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudentOccupation]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateDegreeQualification(index, name, value) {
    setForm((current) => {
      const nextQualifications = current.degreeQualifications.map(
        (item, itemIndex) => {
          if (itemIndex !== index) return item;

          const nextItem = {
            ...item,
            [name]: value,
          };

          if (
            name === 'degreeName' &&
            isStudentOccupation &&
            isRunningDegree(value) &&
            !nextItem.passingYear
          ) {
            nextItem.passingYear = 'current student';
          }

          return nextItem;
        }
      );

      return {
        ...current,
        degreeQualifications: nextQualifications,
      };
    });
  }

  function addDegreeQualification() {
    setForm((current) => ({
      ...current,
      degreeQualifications: [
        ...current.degreeQualifications,
        { ...emptyDegreeQualification },
      ],
    }));
  }

  function removeDegreeQualification(index) {
    setForm((current) => {
      if (current.degreeQualifications.length === 1) {
        return current;
      }

      return {
        ...current,
        degreeQualifications: current.degreeQualifications.filter(
          (_item, itemIndex) => itemIndex !== index
        ),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const finalForm = {
        ...form,
        professionalDetails: isStudentOccupation ? '' : form.professionalDetails,
      };

      const result = await registerAssociationUser(finalForm);

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
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.5fr] lg:items-start lg:gap-6">
        <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-soft md:p-8 lg:sticky lg:top-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Association Portal
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            Member Registration
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
            Fill the single member form. Admin approval is required before your
            profile becomes visible in public directory.
          </p>

          
        </aside>

        <section className="rounded-3xl bg-white p-4 shadow-soft sm:p-6 md:p-8">
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-2xl font-bold text-slate-950">
              Registration Form
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Fields are based on the member information sheet.
            </p>
          </div>

          {status.message ? (
            <StatusBox type={status.type} message={status.message} />
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <FormSection title="Basic Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput
                  label="Full Name (In English as NID)"
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  required
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
                  type="tel"
                  value={form.contactNumber}
                  onChange={updateField}
                  placeholder="01XXXXXXXXX"
                  required
                />

                <TextInput
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  required
                />

                <TextInput
                  label="Facebook Profile Link (If any)"
                  name="facebookProfileLink"
                  value={form.facebookProfileLink}
                  onChange={updateField}
                  placeholder="https://facebook.com/..."
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

            <FormSection title="University Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectInput
                  label="University Hall Name"
                  name="universityHallName"
                  value={form.universityHallName}
                  onChange={updateField}
                  options={hallOptions}
                  placeholder="Select hall"
                  required
                />

                <TextInput
                  label="University First Year Admission Session"
                  name="firstYearAdmissionSession"
                  value={form.firstYearAdmissionSession}
                  onChange={updateField}
                  placeholder="2022-23"
                  required
                />

                <TextInput
                  label="University Subject / Department"
                  name="universitySubject"
                  value={form.universitySubject}
                  onChange={updateField}
                  placeholder="Software Engineering"
                  required
                />

                <FileInput
                  label="University Document"
                  name="universityDocumentFile"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={updateField}
                  required
                />
              </div>
            </FormSection>

            <FormSection title="Academic Qualification">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-4 text-sm font-bold text-slate-900">
                    SSC Information
                  </h4>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <TextInput
                      label="SSC Institute Name"
                      name="sscInstitutionName"
                      value={form.sscInstitutionName}
                      onChange={updateField}
                      placeholder="Noapara Model School"
                      required
                    />

                    <TextInput
                      label="SSC Group"
                      name="sscGroup"
                      value={form.sscGroup}
                      onChange={updateField}
                      placeholder="Science / Commerce / Arts"
                      required
                    />

                    <TextInput
                      label="SSC Passing Year"
                      name="sscPassingYear"
                      value={form.sscPassingYear}
                      onChange={updateField}
                      placeholder="2018"
                      required
                    />

                    <TextInput
                      label="SSC GPA"
                      name="sscGpa"
                      value={form.sscGpa}
                      onChange={updateField}
                      placeholder="5.00"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-4 text-sm font-bold text-slate-900">
                    HSC Information
                  </h4>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <TextInput
                      label="HSC Institute Name"
                      name="hscInstitutionName"
                      value={form.hscInstitutionName}
                      onChange={updateField}
                      placeholder="Cantonment College, Jashore"
                      required
                    />

                    <TextInput
                      label="HSC Group"
                      name="hscGroup"
                      value={form.hscGroup}
                      onChange={updateField}
                      placeholder="Science / Commerce / Arts"
                      required
                    />

                    <TextInput
                      label="HSC Passing Year"
                      name="hscPassingYear"
                      value={form.hscPassingYear}
                      onChange={updateField}
                      placeholder="2020"
                      required
                    />

                    <TextInput
                      label="HSC GPA"
                      name="hscGpa"
                      value={form.hscGpa}
                      onChange={updateField}
                      placeholder="5.00"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      Achieved / Running Degree
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Select degree name and mention passing year. For running
                      students, write “current student” in passing year.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {form.degreeQualifications.map((qualification, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h5 className="text-sm font-bold text-slate-900">
                            Degree {index + 1}
                          </h5>

                          <button
                            type="button"
                            onClick={() => removeDegreeQualification(index)}
                            disabled={form.degreeQualifications.length === 1}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <SelectInput
                            label="Degree Name"
                            name="degreeName"
                            value={qualification.degreeName}
                            onChange={(name, value) =>
                              updateDegreeQualification(index, name, value)
                            }
                            options={degreeOptions}
                            placeholder="Select degree"
                            required
                          />

                          <TextInput
                            label="Institution Name"
                            name="institutionName"
                            value={qualification.institutionName}
                            onChange={(name, value) =>
                              updateDegreeQualification(index, name, value)
                            }
                            placeholder="University of Dhaka"
                          />

                          <TextInput
                            label="Subject / Department"
                            name="subjectDepartment"
                            value={qualification.subjectDepartment}
                            onChange={(name, value) =>
                              updateDegreeQualification(index, name, value)
                            }
                            placeholder="Marketing / Software Engineering"
                          />

                          <TextInput
                            label="Passing Year"
                            name="passingYear"
                            value={qualification.passingYear}
                            onChange={(name, value) =>
                              updateDegreeQualification(index, name, value)
                            }
                            placeholder={
                              isStudentOccupation ? 'current student' : '2024'
                            }
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addDegreeQualification}
                      className="min-h-12 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      + Add Degree
                    </button>
                  </div>
                </div>
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
                  required
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
                required
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
                  required
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
                label="Please Share Your Valuable Memories and Stories from Life"
                name="lifeStory"
                value={form.lifeStory}
                onChange={updateField}
                rows={5}
              />
            </FormSection>

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
                  registration, verification, directory and association services.
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pt-5">
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
  type = 'text',
  required = false,
  placeholder = '',
  disabled = false,
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
        value={value || ''}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  rows = 4,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <textarea
        name={name}
        rows={rows}
        value={value || ''}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
  required = false,
  placeholder = '',
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <select
        name={name}
        value={value || ''}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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