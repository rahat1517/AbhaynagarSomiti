import { supabase } from '../lib/supabaseClient';
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from './authService';
import {
  uploadProfilePhoto,
  uploadUniversityDocument,
} from './verificationService';

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
    p_full_name: form.fullName,
    p_profile_photo_url: profilePhotoUrl,

    p_nick_name: form.nickName || '',
    p_date_of_birth: form.dateOfBirth || null,
    p_gender: form.gender || '',
    p_blood_group: form.bloodGroup || '',

    p_contact_number: form.contactNumber,
    p_facebook_profile_link: form.facebookProfileLink || '',

    university_hall_name: cleanText(form.universityHallName),
    first_year_admission_session: cleanText(form.firstYearAdmissionSession),
    university_subject: cleanText(form.universitySubject),

    p_union_pouroshova_name: form.unionPouroshovaName,
    p_ward_village_name: form.wardVillageName || '',
    p_para_moholla_name: form.paraMohollaName || '',

    present_address: cleanText(form.presentAddress),

    p_occupation: form.occupation,
    p_professional_details: studentOccupation ? '' : form.professionalDetails,

    p_university_document_url: documentPath,
    p_academic_qualifications: mapAcademicQualifications(form),

    p_life_story: form.lifeStory || '',
    p_pdpo_consent: form.pdpoConsent,
  });

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