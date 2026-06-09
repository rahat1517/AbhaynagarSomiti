import { supabase } from '../lib/supabaseClient';
import {
  uploadProfilePhoto,
  uploadUniversityDocument,
} from './verificationService';

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isStudentOccupation(occupation) {
  return String(occupation || '').trim().toLowerCase() === 'student';
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

  if (!cleanText(form.universityHallName)) {
    throw new Error('University hall is required.');
  }

  if (!cleanText(form.firstYearAdmissionSession)) {
    throw new Error('First year admission session is required.');
  }

  if (!cleanText(form.universitySubject)) {
    throw new Error('Subject / Department is required.');
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

function mapAcademicQualifications(form) {
  return [
    {
      level: 'SSC',
      institution_name: cleanText(form.sscInstitutionName),
      group_name: cleanText(form.sscGroup),
      passing_year: cleanText(form.sscPassingYear),
    },
    {
      level: 'HSC',
      institution_name: cleanText(form.hscInstitutionName),
      group_name: cleanText(form.hscGroup),
      passing_year: cleanText(form.hscPassingYear),
    },
  ];
}

async function ensureActiveSession({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.user?.id) {
    throw new Error('User session could not be created.');
  }

  return data.user;
}

export async function registerAssociationUser(form) {
  validateRegistrationForm(form);

  const email = normalizeEmail(form.email);
  const dateOfBirth = `${form.birthMonth}-${form.birthDay}`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: form.password,
    options: {
      data: {
        full_name: cleanText(form.fullName),
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error('User registration failed. Please try again.');
  }

  const activeUser = await ensureActiveSession({
    email,
    password: form.password,
  });

  const profilePhotoUrl = await uploadProfilePhoto({
    userId: activeUser.id,
    file: form.profilePhotoFile,
  });

  const documentPath = await uploadUniversityDocument({
    userId: activeUser.id,
    file: form.universityDocumentFile,
  });

  const studentOccupation = isStudentOccupation(form.occupation);

  const { data, error } = await supabase.rpc('create_member_registration', {
    p_email: email,
    p_full_name: cleanText(form.fullName),
    p_profile_photo_url: profilePhotoUrl,

    p_nick_name: cleanText(form.nickName),
    p_date_of_birth: dateOfBirth,
    p_gender: cleanText(form.gender),
    p_blood_group: cleanText(form.bloodGroup),

    p_contact_number: cleanText(form.contactNumber),
    p_facebook_profile_link: cleanText(form.facebookProfileLink),

    p_university_hall_name: cleanText(form.universityHallName),
    p_first_year_admission_session: cleanText(form.firstYearAdmissionSession),
    p_university_subject: cleanText(form.universitySubject),

    p_union_pouroshova_name: cleanText(form.unionPouroshovaName),
    p_ward_village_name: cleanText(form.wardVillageName),
    p_para_moholla_name: cleanText(form.paraMohollaName),

    p_present_address: cleanText(form.presentAddress),

    p_occupation: cleanText(form.occupation),
    p_professional_details: studentOccupation
      ? ''
      : cleanText(form.professionalDetails),

    p_university_document_url: documentPath,
    p_academic_qualifications: mapAcademicQualifications(form),

    p_life_story: cleanText(form.lifeStory),
    p_pdpo_consent: Boolean(form.pdpoConsent),
  });

  if (error) {
    console.error('create_member_registration error:', error);
    throw new Error(error.message);
  }

  return {
    success: true,
    message:
      'Registration submitted successfully. Please wait for admin approval.',
    memberRegistrationId: data,
  };
}