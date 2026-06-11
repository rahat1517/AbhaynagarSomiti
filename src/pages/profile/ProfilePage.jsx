import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getMyProfileDetails,
  requestMyProfilePhotoUpdate,
  requestMyProfileUpdate,
} from '../../services/profileService';

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
  'Sir P.J. Hartog International Hall',
  'Bangamata Sheikh Fazilatunnesa Mujib Hall',
  'Amar Ekushey Hall',
  'Kabi Sufia Kamal Hall',
  'Bijoy Ekattor Hall',
  'Nabab Foyzunnessa Chowdhurani Chhatrinibash',
  'IBA Hostel',
  'Dr. Qudrat-E-Khuda Hostel',
  'Shahid Athlet Sultana Kamal Hostel',
  'Other',
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

const organizationTypeOptions = [
  'Government Organization',
  'Semi-Government Organization',
  'Private Company',
  'Multinational Company (MNC)',
  'Non-Governmental Organization (NGO)',
  'Educational Institution (School/College/University)',
  'Financial Institution (Bank/Insurance)',
  'Healthcare Institution (Hospital/Clinic)',
  'IT / Software Company',
  'Manufacturing Industry',
  'Trading / Import-Export Business',
  'Self-Owned Business',
  'Others',
];

const occupationOptions = [
  'Government Service Holder',
  'Private Job Holder',
  'Businessman / Entrepreneur',
  'Self-Employed',
  'Freelancer',
  'Student',
  'Teacher / Lecturer',
  'Doctor',
  'Engineer',
  'Banker',
  'NGO Worker',
  'Lawyer',
  'Farmer',
  'Unemployed / Job Seeker',
  'Retired Person',
  'Others',
];

const subjectOptions = [
  'Accounting',
  'Anthropology',
  'Applied Chemistry & Chemical Engineering',
  'Applied Mathematics',
  'Arabic',
  'Art History',
  'Bangla',
  'Banking and Insurance',
  'Biochemistry and Molecular Biology',
  'Biomedical Physics & Technology',
  'Botany',
  'Ceramic',
  'Chemistry',
  'Clinical Pharmacy and Pharmacology',
  'Clinical Psychology',
  'Communication Disorders',
  'Computer Science and Engineering',
  'Craft',
  'Criminology',
  'Dance',
  'Development Studies',
  'Disaster Science and Climate Resilience',
  'Drawing and Painting',
  'Economics',
  'Educational and Counselling Psychology',
  'Electrical and Electronic Engineering',
  'English',
  'Finance',
  'Fisheries',
  'Genetic Engineering and Biotechnology',
  'Geography & Environment',
  'Geology',
  'Graphic Design',
  'History',
  'Information Science and Library Management',
  'International Business',
  'International Relations',
  'Islamic History & Culture',
  'Islamic Studies',
  'Japanese Studies',
  'Law',
  'Linguistics',
  'Management',
  'Management Information Systems (MIS)',
  'Marketing',
  'Mass Communication & Journalism',
  'Mathematics',
  'Meteorology',
  'Microbiology',
  'Music',
  'Nuclear Engineering',
  'Oceanography',
  'Organization Strategy and Leadership',
  'Oriental Art',
  'Pali and Buddhist Studies',
  'Peace and Conflict Studies',
  'Persian Language and Literature',
  'Pharmaceutical Chemistry',
  'Pharmaceutical Technology',
  'Pharmacy',
  'Philosophy',
  'Physics',
  'Political Science',
  'Population Sciences',
  'Printing and Publication Studies',
  'Printmaking',
  'Psychology',
  'Public Administration',
  'Public Health',
  'Robotics and Mechatronics Engineering',
  'Sanskrit',
  'Sculpture',
  'Software Engineering',
  'Sociology',
  'Soil, Water & Environment',
  'Statistics',
  'Television, Film and Photography',
  'Theatre and Performance Studies',
  'Theoretical and Computational Chemistry',
  'Theoretical Physics',
  'Tourism and Hospitality Management',
  'Urdu',
  'Women and Gender Studies',
  'World Religions and Culture',
  'Zoology',
];

const degreeOptions = [
  'BSc',
  'BBA',
  'MBA',
  'MSc',
  'BA',
  'MA',
  'BSS',
  'MSS',
  'LLB',
  'LLM',
  'BPharm',
  'MPharm',
  'MPhil',
  'PhD',
];

const memberTypeOptions = [
  { label: 'Current Student', value: 'student' },
  { label: 'Alumni', value: 'alumni' },
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

  contactNumber: '',
  facebookProfileLink: '',

  universityDegree: '',
  memberType: '',
  universityHallName: '',
  firstYearAdmissionSession: '',
  universitySubject: '',
  academicYear: '',

  sscInstitutionName: '',
  sscGroup: '',
  sscPassingYear: '',

  hscInstitutionName: '',
  hscGroup: '',
  hscPassingYear: '',

  degreeQualifications: [],

  unionPouroshovaName: '',
  wardVillageName: '',
  paraMohollaName: '',

  presentAddress: '',

  occupation: 'Student',
  professionalDetails: '',
  organizationType: '',
  organizationName: '',
  designation: '',
  workSection: '',
  organizationAddress: '',

  lifeStory: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [status, setStatus] = useState({
    type: '',
    message: '',
  });

  const submitStatusRef = useRef(null);

  const isAdmin = profile?.role === 'admin';

  const isStudentOccupation = useMemo(
    () => form.occupation?.toLowerCase() === 'student',
    [form.occupation]
  );

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isStudentOccupation) return;

    setForm((current) => ({
      ...current,
      professionalDetails: '',
      organizationType: '',
      organizationName: '',
      designation: '',
      workSection: '',
      organizationAddress: '',
    }));
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

        universityDegree: data.university_degree || '',
        memberType: data.member_type || '',
        universityHallName: data.university_hall_name || '',
        firstYearAdmissionSession: data.first_year_admission_session || '',
        universitySubject: data.university_subject || '',
        academicYear: data.academic_year || '',

        sscInstitutionName: data.ssc_institution_name || '',
        sscGroup: data.ssc_group || '',
        sscPassingYear: data.ssc_passing_year || '',

        hscInstitutionName: data.hsc_institution_name || '',
        hscGroup: data.hsc_group || '',
        hscPassingYear: data.hsc_passing_year || '',

        degreeQualifications:
          Array.isArray(data.degree_qualifications) &&
          data.degree_qualifications.length > 0
            ? data.degree_qualifications.map((item) => ({
                degreeName: item.degreeName || item.degree_name || '',
                institutionName:
                  item.institutionName || item.institution_name || '',
                passingYear: item.passingYear || item.passing_year || '',
                subjectDepartment:
                  item.subjectDepartment || item.subject_department || '',
              }))
            : [],

        unionPouroshovaName: data.union_pouroshova_name || '',
        wardVillageName: data.ward_village_name || '',
        paraMohollaName: data.para_moholla_name || '',

        presentAddress: data.present_address || '',

        occupation: data.occupation || 'Student',
        professionalDetails: data.professional_details || '',
        organizationType: data.organization_type || '',
        organizationName: data.organization_name || '',
        designation: data.designation || '',
        workSection: data.work_section || '',
        organizationAddress: data.organization_address || '',

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

  function updateDegreeQualification(index, name, value) {
    setForm((current) => ({
      ...current,
      degreeQualifications: current.degreeQualifications.map(
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
    setForm((current) => ({
      ...current,
      degreeQualifications: current.degreeQualifications.filter(
        (_item, itemIndex) => itemIndex !== index
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const finalForm = {
        ...form,
        professionalDetails: isStudentOccupation ? '' : form.professionalDetails,
        organizationType: isStudentOccupation ? '' : form.organizationType,
        organizationName: isStudentOccupation ? '' : form.organizationName,
        designation: isStudentOccupation ? '' : form.designation,
        workSection: isStudentOccupation ? '' : form.workSection,
        organizationAddress: isStudentOccupation ? '' : form.organizationAddress,
      };

      const result = await requestMyProfileUpdate(finalForm);

      await loadProfile();

      setStatus({
        type: 'success',
        message:
          result?.message ||
          'Profile update request submitted successfully. Please wait for admin approval.',
      });
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
    <main className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
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
              Left side shows your submitted information. Right side is for
              update request.
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

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.35fr] xl:items-start">
          <section className="space-y-5 xl:sticky xl:top-5">
            <section className="rounded-3xl bg-white p-4 shadow-soft sm:p-5 md:p-6">
              <ProfileHeader
                profile={profile}
                onPhotoChange={handlePhotoChange}
                photoUploading={photoUploading}
              />
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-soft sm:p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">
                  My Information
                </h2>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {profile.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <ProfileInfoGroup title="Account">
                <ReadonlyItem label="Email" value={profile.email} />
                <ReadonlyItem label="Role" value={profile.role} />
                <ReadonlyItem label="Member Type" value={profile.member_type} />
                <ReadonlyItem
                  label="Verified"
                  value={profile.is_verified ? 'Yes' : 'No'}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="Basic Information">
                <ReadonlyItem label="Full Name" value={profile.full_name} />
                <ReadonlyItem label="Nick Name" value={profile.nick_name} />
                <ReadonlyItem
                  label="Date of Birth"
                  value={profile.date_of_birth}
                />
                <ReadonlyItem label="Gender" value={profile.gender} />
                <ReadonlyItem label="Blood Group" value={profile.blood_group} />
                <ReadonlyItem
                  label="WhatsApp Number"
                  value={profile.contact_number}
                />
                <ReadonlyItem
                  label="Facebook"
                  value={profile.facebook_profile_link}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="University Information">
                <ReadonlyItem
                  label="Degree"
                  value={profile.university_degree}
                />
                <ReadonlyItem
                  label="Hall Name"
                  value={profile.university_hall_name}
                />
                <ReadonlyItem
                  label="Admission Session"
                  value={profile.first_year_admission_session}
                />
                <ReadonlyItem
                  label="Subject / Department"
                  value={profile.university_subject}
                />
                <ReadonlyItem
                  label="Passing Year / Current Year"
                  value={profile.academic_year}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="SSC Information">
                <ReadonlyItem
                  label="Institute Name"
                  value={profile.ssc_institution_name}
                />
                <ReadonlyItem label="Group" value={profile.ssc_group} />
                <ReadonlyItem
                  label="Passing Year"
                  value={profile.ssc_passing_year}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="HSC Information">
                <ReadonlyItem
                  label="Institute Name"
                  value={profile.hsc_institution_name}
                />
                <ReadonlyItem label="Group" value={profile.hsc_group} />
                <ReadonlyItem
                  label="Passing Year"
                  value={profile.hsc_passing_year}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="Address">
                <ReadonlyItem
                  label="Union / Pouroshova"
                  value={profile.union_pouroshova_name}
                />
                <ReadonlyItem
                  label="Ward / Village"
                  value={profile.ward_village_name}
                />
                <ReadonlyItem
                  label="Para / Moholla"
                  value={profile.para_moholla_name}
                />
                <ReadonlyItem
                  label="Present Address"
                  value={profile.present_address}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="Professional Information">
                <ReadonlyItem label="Occupation" value={profile.occupation} />
                <ReadonlyItem
                  label="Organization Type"
                  value={profile.organization_type}
                />
                <ReadonlyItem
                  label="Organization Name"
                  value={profile.organization_name}
                />
                <ReadonlyItem label="Designation" value={profile.designation} />
                <ReadonlyItem
                  label="Work Section"
                  value={profile.work_section}
                />
                <ReadonlyItem
                  label="Organization Address"
                  value={profile.organization_address}
                />
                <ReadonlyItem
                  label="Professional Details"
                  value={profile.professional_details}
                />
              </ProfileInfoGroup>

              <ProfileInfoGroup title="Memories and Stories">
                <ReadonlyItem label="Life Story" value={profile.life_story} />
              </ProfileInfoGroup>
            </section>
          </section>

          <section className="rounded-3xl bg-white p-4 shadow-soft sm:p-5 md:p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Editable Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Update request will be applied only after admin approval.
            </p>

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
                    type="text"
                    value={form.dateOfBirth}
                    onChange={updateField}
                    placeholder="MM-DD"
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
                    label="WhatsApp Number"
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
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </FormSection>

              <FormSection title="University Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Degree"
                    name="universityDegree"
                    value={form.universityDegree}
                    onChange={updateField}
                    options={degreeOptions}
                    placeholder="Select degree"
                  />

                  <SelectInput
                    label="Hall Name"
                    name="universityHallName"
                    value={form.universityHallName}
                    onChange={updateField}
                    options={hallOptions}
                    placeholder="Select hall"
                  />

                  <TextInput
                    label="Admission Session"
                    name="firstYearAdmissionSession"
                    value={form.firstYearAdmissionSession}
                    onChange={updateField}
                    placeholder="2022-23"
                  />

                  <SelectInput
                    label="Subject / Department"
                    name="universitySubject"
                    value={form.universitySubject}
                    onChange={updateField}
                    options={subjectOptions}
                    placeholder="Select subject / department"
                  />

                  <SelectInput
                    label="Member Type"
                    name="memberType"
                    value={form.memberType}
                    onChange={updateField}
                    options={memberTypeOptions}
                    placeholder="Select member type"
                  />

                  <TextInput
                    label="Passing Year / Current Year"
                    name="academicYear"
                    value={form.academicYear}
                    onChange={updateField}
                    placeholder="2026 / 1st Year / 2nd Year"
                  />
                </div>
              </FormSection>

              <FormSection title="SSC Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <TextInput
                    label="Institute Name"
                    name="sscInstitutionName"
                    value={form.sscInstitutionName}
                    onChange={updateField}
                    placeholder="Pairahat High School"
                  />

                  <TextInput
                    label="Group"
                    name="sscGroup"
                    value={form.sscGroup}
                    onChange={updateField}
                    placeholder="Science / Commerce / Arts"
                  />

                  <TextInput
                    label="Passing Year"
                    name="sscPassingYear"
                    value={form.sscPassingYear}
                    onChange={updateField}
                    placeholder="2020"
                  />
                </div>
              </FormSection>

              <FormSection title="HSC Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <TextInput
                    label="Institute Name"
                    name="hscInstitutionName"
                    value={form.hscInstitutionName}
                    onChange={updateField}
                    placeholder="Pairahat United College"
                  />

                  <TextInput
                    label="Group"
                    name="hscGroup"
                    value={form.hscGroup}
                    onChange={updateField}
                    placeholder="Science / Commerce / Arts"
                  />

                  <TextInput
                    label="Passing Year"
                    name="hscPassingYear"
                    value={form.hscPassingYear}
                    onChange={updateField}
                    placeholder="2022"
                  />
                </div>
              </FormSection>

              <FormSection title="Higher Degree">
                <div className="space-y-4">
                  {form.degreeQualifications.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Higher degree is optional. Click Add Degree if you want to
                      add one.
                    </p>
                  ) : null}

                  {form.degreeQualifications.map((qualification, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-900">
                          Degree {index + 1}
                        </h4>

                        <button
                          type="button"
                          onClick={() => removeDegreeQualification(index)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
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
                        />

                        <TextInput
                          label="Institution Name"
                          name="institutionName"
                          value={qualification.institutionName}
                          onChange={(name, value) =>
                            updateDegreeQualification(index, name, value)
                          }
                          placeholder="University / Institution name"
                        />

                        <TextInput
                          label="Subject / Department"
                          name="subjectDepartment"
                          value={qualification.subjectDepartment}
                          onChange={(name, value) =>
                            updateDegreeQualification(index, name, value)
                          }
                          placeholder="Subject / Department"
                        />

                        <TextInput
                          label="Passing Year / Current Year"
                          name="passingYear"
                          value={qualification.passingYear}
                          onChange={(name, value) =>
                            updateDegreeQualification(index, name, value)
                          }
                          placeholder="2026 / Running"
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

              <FormSection title="Professional Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Occupation"
                    name="occupation"
                    value={form.occupation}
                    onChange={updateField}
                    options={occupationOptions}
                  />

                  <SelectInput
                    label="Organization Type"
                    name="organizationType"
                    value={form.organizationType}
                    onChange={updateField}
                    options={organizationTypeOptions}
                    placeholder={
                      isStudentOccupation
                        ? 'Disabled for students'
                        : 'Select organization type'
                    }
                    disabled={isStudentOccupation}
                  />

                  <TextInput
                    label="Organization Name"
                    name="organizationName"
                    value={form.organizationName}
                    onChange={updateField}
                    placeholder="Organization / company name"
                    disabled={isStudentOccupation}
                  />

                  <TextInput
                    label="Designation"
                    name="designation"
                    value={form.designation}
                    onChange={updateField}
                    placeholder="Your designation"
                    disabled={isStudentOccupation}
                  />

                  <TextInput
                    label="Work Section"
                    name="workSection"
                    value={form.workSection}
                    onChange={updateField}
                    placeholder="Department / section"
                    disabled={isStudentOccupation}
                  />

                  <TextArea
                    label="Organization Address"
                    name="organizationAddress"
                    value={form.organizationAddress}
                    onChange={updateField}
                    placeholder="Office / organization address"
                    disabled={isStudentOccupation}
                    rows={3}
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label="Professional Details"
                      name="professionalDetails"
                      value={form.professionalDetails}
                      onChange={updateField}
                      disabled={isStudentOccupation}
                      placeholder={
                        isStudentOccupation
                          ? 'Disabled for students'
                          : 'Write short professional details, achievements, or current work summary'
                      }
                    />
                  </div>
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

              <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {saving ? 'Submitting Request...' : 'Submit Update Request'}
                </button>

                {status.message ? (
                  <StatusBox type={status.type} message={status.message} />
                ) : null}
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
              {(profile.full_name || profile.nick_name || '?')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-950">
            {profile.full_name || profile.nick_name || 'Unnamed User'}
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

function ProfileInfoGroup({ title, children }) {
  return (
    <section className="mt-5">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">
        {title}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {children}
      </div>
    </section>
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
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value || ''}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}

        {options.map((item) => {
          const optionValue = typeof item === 'object' ? item.value : item;
          const optionLabel = typeof item === 'object' ? item.label : item;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
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