import { supabase } from '../lib/supabaseClient';

const PROFILE_PHOTO_BUCKET = 'profile-photos';

function cleanText(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getFileExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

async function uploadProfilePhoto({ userId, file }) {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  if (!file) {
    return null;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, or WEBP profile photo is allowed.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Profile photo must be 5MB or smaller.');
  }

  const timestamp = Date.now();
  const extension = getFileExtension(file.name) || 'jpg';
  const safeFileName = `profile-${timestamp}.${extension}`;
  const storagePath = `${userId}/${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('uploadProfilePhoto error:', error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export async function uploadUniversityDocument() {
  return null;
}

export async function getSignedUniversityDocumentUrl() {
  return null;
}

export async function requestMyUniversityDocumentUpdate() {
  return {
    success: true,
    message: 'University document update is disabled.',
  };
}

function validateRegistrationForm(form) {
  if (!cleanText(form.fullName)) {
    throw new Error('Full name is required.');
  }

  if (!form.birthMonth || !form.birthDay) {
    throw new Error('Date of Birth month and day are required.');
  }

  if (!cleanText(form.email)) {
    throw new Error('Email is required.');
  }

  if (!cleanText(form.password)) {
    throw new Error('Password is required.');
  }

  if (!cleanText(form.confirmPassword)) {
    throw new Error('Confirm password is required.');
  }

  if (form.password !== form.confirmPassword) {
    throw new Error('Password and confirm password do not match.');
  }

  if (!cleanText(form.contactNumber)) {
    throw new Error('WhatsApp number is required.');
  }

  if (!cleanText(form.universityDegree)) {
    throw new Error('University degree is required.');
  }

  if (!cleanText(form.universityHallName)) {
    throw new Error('University hall is required.');
  }

  if (!cleanText(form.firstYearAdmissionSession)) {
    throw new Error('First year admission session is required.');
  }

  if (!cleanText(form.universitySubject)) {
    throw new Error('Subject / Department is required.');
  }

  const memberType = cleanText(form.memberType)?.toLowerCase();

  if (!memberType || !['student', 'alumni'].includes(memberType)) {
    throw new Error('Member type is required.');
  }

  if (!cleanText(form.academicYear)) {
    throw new Error('Passing Year / Current Year is required.');
  }

  if (!cleanText(form.sscInstitutionName)) {
    throw new Error('SSC institute name is required.');
  }

  if (!cleanText(form.sscGroup)) {
    throw new Error('SSC group is required.');
  }

  if (!cleanText(form.sscPassingYear)) {
    throw new Error('SSC passing year is required.');
  }

  if (!cleanText(form.hscInstitutionName)) {
    throw new Error('HSC institute name is required.');
  }

  if (!cleanText(form.hscGroup)) {
    throw new Error('HSC group is required.');
  }

  if (!cleanText(form.hscPassingYear)) {
    throw new Error('HSC passing year is required.');
  }

  if (!cleanText(form.unionPouroshovaName)) {
    throw new Error('Union / Pouroshova name is required.');
  }

  if (!cleanText(form.presentAddress)) {
    throw new Error('Present address is required.');
  }

  if (!form.pdpoConsent) {
    throw new Error('Consent is required.');
  }
}

export async function registerAssociationUser(form) {
  validateRegistrationForm(form);

  const email = cleanText(form.email);
  const dateOfBirth = `${form.birthMonth}-${form.birthDay}`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: form.password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error('User registration failed. Please try again.');
  }

  let profilePhotoUrl = null;

  if (form.profilePhotoFile) {
    profilePhotoUrl = await uploadProfilePhoto({
      userId,
      file: form.profilePhotoFile,
    });
  }

  const isStudent =
    cleanText(form.occupation)?.toLowerCase() === 'student' ||
    !cleanText(form.occupation);

  const memberType = cleanText(form.memberType).toLowerCase();

  const profilePayload = {
    id: userId,
    email,
    role: 'member',

    full_name: cleanText(form.fullName),
    nick_name: cleanText(form.nickName),

    date_of_birth: dateOfBirth,
    birth_month: form.birthMonth,
    birth_day: form.birthDay,

    gender: cleanText(form.gender),
    blood_group: cleanText(form.bloodGroup),

    contact_number: cleanText(form.contactNumber),
    facebook_profile_link: cleanText(form.facebookProfileLink),
    profile_photo_url: profilePhotoUrl,

    university_degree: cleanText(form.universityDegree),
    university_hall_name: cleanText(form.universityHallName),
    first_year_admission_session: cleanText(form.firstYearAdmissionSession),
    university_subject: cleanText(form.universitySubject),
    member_type: memberType,
    academic_year: cleanText(form.academicYear),

    university_document_url: null,

    ssc_institution_name: cleanText(form.sscInstitutionName),
    ssc_group: cleanText(form.sscGroup),
    ssc_passing_year: cleanText(form.sscPassingYear),

    hsc_institution_name: cleanText(form.hscInstitutionName),
    hsc_group: cleanText(form.hscGroup),
    hsc_passing_year: cleanText(form.hscPassingYear),

    union_pouroshova_name: cleanText(form.unionPouroshovaName),
    ward_village_name: cleanText(form.wardVillageName),
    para_moholla_name: cleanText(form.paraMohollaName),

    present_address: cleanText(form.presentAddress),

    occupation: cleanText(form.occupation) || 'Student',
    professional_details: isStudent ? null : cleanText(form.professionalDetails),
    organization_type: isStudent ? null : cleanText(form.organizationType),
    organization_name: isStudent ? null : cleanText(form.organizationName),
    designation: isStudent ? null : cleanText(form.designation),
    work_section: isStudent ? null : cleanText(form.workSection),
    organization_address: isStudent ? null : cleanText(form.organizationAddress),

    life_story: cleanText(form.lifeStory),

    pdpo_consent: Boolean(form.pdpoConsent),
    pdpo_consent_timestamp: new Date().toISOString(),

    verification_status: 'pending',
    is_verified: false,
    is_approved: false,
  };

  console.log('Registration profilePayload:', profilePayload);

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert(profilePayload, {
      onConflict: 'id',
    })
    .select()
    .single();

  console.log('Supabase profileData:', profileData);
  console.log('Supabase profileError:', profileError);

  if (profileError) {
    console.error('profile registration error:', profileError);
    throw new Error(profileError.message);
  }

  const degreeRows = (form.degreeQualifications || [])
    .filter((item) => {
      return (
        cleanText(item.degreeName) ||
        cleanText(item.institutionName) ||
        cleanText(item.subjectDepartment) ||
        cleanText(item.passingYear)
      );
    })
    .map((item) => ({
      profile_id: userId,
      degree_name: cleanText(item.degreeName),
      institution_name: cleanText(item.institutionName),
      subject_department: cleanText(item.subjectDepartment),
      passing_year: cleanText(item.passingYear),
    }));

  console.log('Registration degreeRows:', degreeRows);

  const { error: deleteDegreeError } = await supabase
    .from('member_degree_qualifications')
    .delete()
    .eq('profile_id', userId);

  if (deleteDegreeError) {
    console.error('delete old degree qualifications error:', deleteDegreeError);
    throw new Error(deleteDegreeError.message);
  }

  if (degreeRows.length > 0) {
    const { error: degreeError } = await supabase
      .from('member_degree_qualifications')
      .insert(degreeRows);

    if (degreeError) {
      console.error('degree qualification insert error:', degreeError);
      throw new Error(degreeError.message);
    }
  }

  return {
    success: true,
    message:
      'Registration submitted successfully. Please wait for admin approval.',
    member: profileData,
  };
}