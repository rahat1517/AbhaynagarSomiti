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

function validateCommonFields(form) {
  if (!form.fullName) {
    throw new Error('Full name is required.');
  }

  if (!form.email || !form.password || !form.confirmPassword) {
    throw new Error('Email, password, and confirm password are required.');
  }

  if (form.password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  if (form.password !== form.confirmPassword) {
    throw new Error('Password and confirm password do not match.');
  }

  if (!form.contactNumber) {
    throw new Error('Mobile number is required.');
  }

  if (!form.profilePhotoFile) {
    throw new Error('Profile photo is required.');
  }

  if (!form.universityHallName) {
    throw new Error('University hall name is required.');
  }

  if (!form.firstYearAdmissionSession) {
    throw new Error('University first year admission session is required.');
  }

  if (!form.universitySubject) {
    throw new Error('University subject is required.');
  }

  if (!form.unionPouroshovaName) {
    throw new Error('Union/Pouroshova name is required.');
  }

  if (!form.presentAddress) {
    throw new Error('Present address is required.');
  }

  if (!form.occupation) {
    throw new Error('Occupation is required.');
  }

  if (!isStudentOccupation(form.occupation) && !form.professionalDetails) {
    throw new Error('Professional details are required when occupation is not Student.');
  }

  if (!form.universityDocumentFile) {
    throw new Error('University document is required.');
  }

  if (!form.pdpoConsent) {
    throw new Error('You must agree to the privacy consent.');
  }
}

function validateAcademicQualifications(qualifications) {
  if (!Array.isArray(qualifications) || qualifications.length === 0) {
    throw new Error('At least one academic qualification is required.');
  }

  const hasValidRow = qualifications.some((item) => {
    return (
      String(item.degreeName || '').trim() ||
      String(item.institutionName || '').trim() ||
      String(item.passingYear || '').trim() ||
      String(item.subjectDepartment || '').trim() ||
      String(item.academicDegreeName || '').trim()
    );
  });

  if (!hasValidRow) {
    throw new Error('At least one academic qualification row must be filled.');
  }
}

function mapAcademicQualifications(qualifications) {
  return qualifications
    .filter((item) => {
      return (
        String(item.degreeName || '').trim() ||
        String(item.institutionName || '').trim() ||
        String(item.passingYear || '').trim() ||
        String(item.subjectDepartment || '').trim() ||
        String(item.academicDegreeName || '').trim()
      );
    })
    .map((item) => ({
      degree_name: String(item.degreeName || '').trim() || 'Other',
      institution_name: String(item.institutionName || '').trim(),
      passing_year: String(item.passingYear || '').trim(),
      subject_department: String(item.subjectDepartment || '').trim(),
      academic_degree_name: String(item.academicDegreeName || '').trim(),
    }));
}

async function ensureActiveSession({ email, password }) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (session?.user?.id) {
    return session.user;
  }

  const loginData = await signInWithEmailPassword({
    email,
    password,
  });

  if (!loginData.user) {
    throw new Error('Signup succeeded but login session was not created.');
  }

  return loginData.user;
}

export async function registerAssociationUser(form) {
  validateCommonFields(form);
  validateAcademicQualifications(form.academicQualifications);

  const email = normalizeEmail(form.email);

  const authData = await signUpWithEmailPassword({
    email,
    password: form.password,
  });

  if (!authData.user) {
    throw new Error('Signup failed. Please try again.');
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

    p_university_hall_name: form.universityHallName,
    p_first_year_admission_session: form.firstYearAdmissionSession,
    p_university_subject: form.universitySubject,

    p_union_pouroshova_name: form.unionPouroshovaName,
    p_ward_village_name: form.wardVillageName || '',
    p_para_moholla_name: form.paraMohollaName || '',

    p_present_address: form.presentAddress,

    p_occupation: form.occupation,
    p_professional_details: studentOccupation ? '' : form.professionalDetails,

    p_university_document_url: documentPath,
    p_academic_qualifications: mapAcademicQualifications(
      form.academicQualifications
    ),

    p_life_story: form.lifeStory || '',
    p_pdpo_consent: form.pdpoConsent,
  });

  if (error) {
    console.error('create_member_registration error:', error);
    throw new Error(error.message);
  }

  return {
    user: activeUser,
    role: 'member',
    message:
      data?.message ||
      'Registration submitted successfully. Admin approval is required.',
  };
}