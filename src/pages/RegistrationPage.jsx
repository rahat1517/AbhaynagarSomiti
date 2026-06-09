import { useEffect, useMemo, useState } from 'react';
import { registerAssociationUser } from '../services/registrationService';

const hallOptions = [
  'Salimullah Muslim Hall',
  'Dr. Muhammad Shahidullah Hall',
  'Jagannath Hall',
  'Fazlul Huq Muslim Hall',
  'Shahid Sergeant Zahurul Huq Hall',
  'Ruqayyah Hall',
  'Surja Sen Hall',
  'Haji Muhammad Mohsin Hall',
  'Shamsun Nahar Hall',
  'Kabi Jasimuddin Hall',
  'A.F. Rahman Hall',
  'Muktijoddha Ziaur Rahman Hall',
  'Sheikh Mujibur Rahman Hall',
  'Bangladesh-Kuwait Maitree Hall',
  'Bangamata Sheikh Fazilatunnesa Mujib Hall',
  'Amar Ekushey Hall',
  'Kabi Sufia Kamal Hall',
  'Bijoy Ekattor Hall',
  'Nabab Foyzunnessa Chowdhurani Chhatrinibash',
  'IBA Hostel',
  'Dr. Qudrat-E-Khuda Hostel',
  'Shahid Athlet Sultana Kamal Hostel',
];

const unionOptions = [
  'Prembag Union',
  'Sundali Union',
  'Chalishia Union',
  'Payra Union',
  'Sreedharpur Union',
  'Subharara Union',
  'Siddhipasha Union',
  'Baghutia Union',
  'Noapara Paurashava',
  'Other',
];

const genderOptions = ['Male', 'Female'];

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const occupationOptions = [
  'Student',
  'Teacher',
  'Doctor',
  'Engineer',
  'Lawyer',
  'Banker',
  'Business',
  'Service Holder',
  'Government Employee',
  'Private Employee',
  'Freelancer',
  'Entrepreneur',
  'Farmer',
  'Journalist',
  'Researcher',
  'Housewife',
  'Retired',
  'Unemployed',
  'Other',
];

const bachelorDegreeOptions = ['BSc', 'BBA', 'BA', 'BSS', 'LLB'];

const higherDegreeOptions = [
  'MSc',
  'MBA',
  'MA',
  'MSS',
  'LLM',
  'MPhil',
  'PhD',
  'DBA',
];

const emptyHigherDegreeQualification = {
  degreeName: '',
  institutionName: '',
  subjectDepartment: '',
  passingYear: '',
};

const initialForm = {
  fullName: '',
  nickName: '',

  dateOfBirth: '',
  birthMonth: '',
  birthDay: '',

  gender: '',
  bloodGroup: '',

  email: '',
  password: '',
  confirmPassword: '',
  contactNumber: '',
  facebookProfileLink: '',

  profilePhotoFile: null,

  bachelorDegreeName: '',
  bachelorInstitutionName: 'University of Dhaka',
  bachelorDepartment: '',
  bachelorPassingYear: '',
  bachelorHallName: '',
  bachelorSession: '',

  universityHallName: '',
  firstYearAdmissionSession: '',

  sscInstitutionName: '',
  sscGroup: '',
  sscPassingYear: '',

  hscInstitutionName: '',
  hscGroup: '',
  hscPassingYear: '',

  higherDegreeQualifications: [],

  unionPouroshovaName: '',
  wardVillageName: '',
  paraMohollaName: '',

  presentAddress: '',

  occupation: 'Student',
  professionalDetails: '',

  lifeStory: '',
  pdpoConsent: false,
};

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
  }, [isStudentOccupation]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateHigherDegreeQualification(index, name, value) {
    setForm((current) => {
      const nextQualifications = current.higherDegreeQualifications.map(
        (item, itemIndex) => {
          if (itemIndex !== index) return item;

          return {
            ...item,
            [name]: value,
          };
        }
      );

      return {
        ...current,
        higherDegreeQualifications: nextQualifications,
      };
    });
  }

  function addHigherDegreeQualification() {
    setForm((current) => ({
      ...current,
      higherDegreeQualifications: [
        ...current.higherDegreeQualifications,
        { ...emptyHigherDegreeQualification },
      ],
    }));
  }

  function removeHigherDegreeQualification(index) {
    setForm((current) => ({
      ...current,
      higherDegreeQualifications: current.higherDegreeQualifications.filter(
        (_item, itemIndex) => itemIndex !== index
      ),
    }));
  }

  function buildDegreeQualifications() {
    const degreeQualifications = [];

    if (form.bachelorDegreeName) {
      degreeQualifications.push({
        degreeName: form.bachelorDegreeName,
        institutionName: form.bachelorInstitutionName,
        subjectDepartment: form.bachelorDepartment,
        passingYear: form.bachelorPassingYear,
      });
    }

    form.higherDegreeQualifications.forEach((qualification) => {
      if (qualification.degreeName) {
        degreeQualifications.push({
          degreeName: qualification.degreeName,
          institutionName: qualification.institutionName,
          subjectDepartment: qualification.subjectDepartment,
          passingYear: qualification.passingYear,
        });
      }
    });

    return degreeQualifications;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.birthMonth || !form.birthDay) {
      setStatus({
        type: 'error',
        message: 'Date of Birth month and day are required.',
      });
      return;
    }

    if (!form.bachelorDegreeName) {
      setStatus({
        type: 'error',
        message: 'Bachelor / Honours degree name is required.',
      });
      return;
    }

    if (!form.bachelorHallName || !form.bachelorSession) {
      setStatus({
        type: 'error',
        message: 'Hall Name and Session are required for Bachelor / Honours information.',
      });
      return;
    }

    if (!form.bachelorDepartment || !form.bachelorPassingYear) {
      setStatus({
        type: 'error',
        message: 'Department and Passing Year are required for Bachelor / Honours information.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const finalForm = {
        ...form,
        dateOfBirth: `${form.birthMonth}-${form.birthDay}`,

        universityHallName: form.bachelorHallName,
        firstYearAdmissionSession: form.bachelorSession,

        degreeQualifications: buildDegreeQualifications(),

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
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[0.82fr_1.45fr] xl:items-start xl:gap-7">
        <aside className="overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-soft xl:sticky xl:top-24">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 sm:p-7 lg:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300 sm:text-xs sm:tracking-[0.3em]">
              Registration
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight sm:mt-4 sm:text-4xl">
              Association Portal
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
              Fill the single member form. Admin approval is required before
              your profile becomes visible in the public directory.
            </p>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
          {status.message ? (
            <StatusBox type={status.type} message={status.message} />
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8"
          >
            <FormSection title="Basic Information">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
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

                <MonthDayInput
                  label="Date of Birth (Original)"
                  monthName="birthMonth"
                  dayName="birthDay"
                  monthValue={form.birthMonth}
                  dayValue={form.birthDay}
                  onChange={updateField}
                  required
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
                  label="WhatsApp Number (Personal)"
                  name="contactNumber"
                  type="tel"
                  value={form.contactNumber}
                  onChange={updateField}
                  placeholder="01XXXXXXXXX"
                  required
                />

                <TextInput
                  label="Email (Personal)"
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

            <FormSection title="Academic Qualification">
              <div className="space-y-4 sm:space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4">
                    SSC Information
                  </h4>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextInput
                      label="Institute Name"
                      name="sscInstitutionName"
                      value={form.sscInstitutionName}
                      onChange={updateField}
                      placeholder="Pairahat High School"
                      required
                    />

                    <TextInput
                      label="Group"
                      name="sscGroup"
                      value={form.sscGroup}
                      onChange={updateField}
                      placeholder="Science / Commerce / Arts"
                      required
                    />

                    <TextInput
                      label="Passing Year"
                      name="sscPassingYear"
                      value={form.sscPassingYear}
                      onChange={updateField}
                      placeholder="2020"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4">
                    HSC Information
                  </h4>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextInput
                      label="Institute Name"
                      name="hscInstitutionName"
                      value={form.hscInstitutionName}
                      onChange={updateField}
                      placeholder="Pairahat United College"
                      required
                    />

                    <TextInput
                      label="Group"
                      name="hscGroup"
                      value={form.hscGroup}
                      onChange={updateField}
                      placeholder="Science / Commerce / Arts"
                      required
                    />

                    <TextInput
                      label="Passing Year"
                      name="hscPassingYear"
                      value={form.hscPassingYear}
                      onChange={updateField}
                      placeholder="2022"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                  <div className="mb-4 flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-slate-900 sm:text-base">
                      Bachelor / Honours Information
                    </h4>

                    <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                      This section is required. Hall Name and Session will be
                      saved from this section.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <SelectInput
                      label="Degree Name"
                      name="bachelorDegreeName"
                      value={form.bachelorDegreeName}
                      onChange={updateField}
                      options={bachelorDegreeOptions}
                      placeholder="Select bachelor degree"
                      required
                    />

                    <TextInput
                      label="Institution Name"
                      name="bachelorInstitutionName"
                      value={form.bachelorInstitutionName}
                      onChange={updateField}
                      placeholder="University of Dhaka"
                      required
                    />

                    <TextInput
                      label="Department"
                      name="bachelorDepartment"
                      value={form.bachelorDepartment}
                      onChange={updateField}
                      placeholder="Software Engineering"
                      required
                    />

                    <SelectInput
                      label="Hall Name"
                      name="bachelorHallName"
                      value={form.bachelorHallName}
                      onChange={updateField}
                      options={hallOptions}
                      placeholder="Select hall"
                      required
                    />

                    <TextInput
                      label="Session"
                      name="bachelorSession"
                      value={form.bachelorSession}
                      onChange={updateField}
                      placeholder="2022-23"
                      required
                    />

                    <TextInput
                      label="Passing Year"
                      name="bachelorPassingYear"
                      value={form.bachelorPassingYear}
                      onChange={updateField}
                      placeholder="2026"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-900 sm:text-base">
                      Higher Degree Information
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                      Higher degree is optional. Add Masters, MPhil, PhD, DBA or
                      other higher qualification if applicable.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {form.higherDegreeQualifications.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                        No higher degree added yet. Click Add Higher Degree if
                        you want to add one.
                      </p>
                    ) : null}

                    {form.higherDegreeQualifications.map((qualification, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h5 className="text-sm font-bold text-slate-900 sm:text-base">
                            Higher Degree {index + 1}
                          </h5>

                          <button
                            type="button"
                            onClick={() => removeHigherDegreeQualification(index)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                          <SelectInput
                            label="Degree Name"
                            name="degreeName"
                            value={qualification.degreeName}
                            onChange={(name, value) =>
                              updateHigherDegreeQualification(index, name, value)
                            }
                            options={higherDegreeOptions}
                            placeholder="Select higher degree"
                          />

                          <TextInput
                            label="Institution Name"
                            name="institutionName"
                            value={qualification.institutionName}
                            onChange={(name, value) =>
                              updateHigherDegreeQualification(index, name, value)
                            }
                            placeholder="University of Dhaka"
                          />

                          <TextInput
                            label="Department"
                            name="subjectDepartment"
                            value={qualification.subjectDepartment}
                            onChange={(name, value) =>
                              updateHigherDegreeQualification(index, name, value)
                            }
                            placeholder="Software Engineering"
                          />

                          <TextInput
                            label="Passing Year"
                            name="passingYear"
                            value={qualification.passingYear}
                            onChange={(name, value) =>
                              updateHigherDegreeQualification(index, name, value)
                            }
                            placeholder="2024"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addHigherDegreeQualification}
                      className="min-h-11 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100 sm:min-h-12 sm:rounded-2xl sm:px-5"
                    >
                      + Add Higher Degree
                    </button>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Address in Abhaynagar">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
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
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
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
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 sm:min-h-12 sm:rounded-2xl sm:px-5"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:bg-emerald-300 sm:min-h-12 sm:rounded-2xl sm:px-6"
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

function StatusBox({ type, message }) {
  return (
    <div
      className={`mx-4 mt-5 rounded-2xl border p-4 text-sm font-medium sm:mx-6 lg:mx-8 ${
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
      <h3 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4 sm:text-base">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MonthDayInput({
  label,
  monthName,
  dayName,
  monthValue,
  dayValue,
  onChange,
  required = false,
}) {
  const monthOptions = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const dayOptions = Array.from({ length: 31 }, (_item, index) => {
    const day = String(index + 1).padStart(2, '0');

    return {
      label: day,
      value: day,
    };
  });

  function updateMonth(value) {
    onChange(monthName, value);

    if (value && dayValue) {
      onChange('dateOfBirth', `${value}-${dayValue}`);
    } else {
      onChange('dateOfBirth', '');
    }
  }

  function updateDay(value) {
    onChange(dayName, value);

    if (monthValue && value) {
      onChange('dateOfBirth', `${monthValue}-${value}`);
    } else {
      onChange('dateOfBirth', '');
    }
  }

  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <div className="grid grid-cols-2 gap-3">
        <select
          value={monthValue || ''}
          required={required}
          onChange={(event) => updateMonth(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:min-h-12 sm:rounded-2xl sm:px-4"
        >
          <option value="">Month</option>

          {monthOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={dayValue || ''}
          required={required}
          onChange={(event) => updateDay(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:min-h-12 sm:rounded-2xl sm:px-4"
        >
          <option value="">Day</option>

          {dayOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {monthValue && dayValue ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500">
          Saved as: {monthValue}-{dayValue}
        </p>
      ) : null}
    </div>
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
      <span className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
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
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-12 sm:rounded-2xl sm:px-4"
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
      <span className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
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
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:rounded-2xl sm:px-4 sm:py-3"
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
      <span className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <select
        name={name}
        value={value || ''}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:min-h-12 sm:rounded-2xl sm:px-4"
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
      <span className="mb-1.5 block text-xs font-semibold text-slate-700 sm:text-sm">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <input
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={(event) => onChange(name, event.target.files?.[0] || null)}
        className="block min-h-11 w-full rounded-xl border border-slate-300 bg-white text-xs file:mr-3 file:min-h-11 file:border-0 file:bg-slate-900 file:px-3 file:text-xs file:font-semibold file:text-white sm:min-h-12 sm:rounded-2xl sm:text-sm sm:file:mr-4 sm:file:min-h-12 sm:file:px-4 sm:file:text-sm"
      />
    </label>
  );
}