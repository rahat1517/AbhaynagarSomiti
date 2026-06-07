import { supabase } from '../lib/supabaseClient';
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from './authService';
import {
  createAlumniVerificationRequest,
  uploadProfilePhoto,
  uploadUniversityDocument,
  verifyStudentAgainstRoster,
} from './verificationService';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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
    throw new Error('Contact number is required.');
  }

  if (!form.profilePhotoFile) {
    throw new Error('Profile photo is required.');
  }

  if (!form.academicSession) {
    throw new Error('Academic session is required.');
  }

  if (!form.presentAddress) {
    throw new Error('Present address is required.');
  }

  if (!form.permanentAddress) {
    throw new Error('Permanent address is required.');
  }

  if (!form.pdpoConsent) {
    throw new Error('You must agree to the PDPO 2025 privacy consent.');
  }

  if (!['student', 'alumni'].includes(form.role)) {
    throw new Error('Invalid registration role.');
  }
}

function validateStudentFields(form) {
  if (!form.rollNumber) {
    throw new Error('Roll number is required.');
  }

  if (!form.departmentName) {
    throw new Error('Department name is required.');
  }

  const semester = Number(form.currentSemester);

  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    throw new Error('Current semester must be between 1 and 12.');
  }
}

function validateAlumniFields(form) {
  if (!form.registrationNo) {
    throw new Error('Registration number is required.');
  }

  if (!form.departmentName) {
    throw new Error('Department name is required.');
  }

  if (!form.hall) {
    throw new Error('Hall is required.');
  }

  const graduationYear = Number(form.graduationYear);
  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(graduationYear) ||
    graduationYear < 1950 ||
    graduationYear > currentYear
  ) {
    throw new Error(`Graduation year must be between 1950 and ${currentYear}.`);
  }

  if (!form.universityDocumentFile) {
    throw new Error('University document is required.');
  }

  const allowedDocumentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedDocumentTypes.includes(form.universityDocumentFile.type)) {
    throw new Error('Only PDF, JPG, PNG, or WEBP university document is allowed.');
  }
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

  if (form.role === 'student') {
    validateStudentFields(form);
  }

  if (form.role === 'alumni') {
    validateAlumniFields(form);
  }

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

  if (form.role === 'student') {
    const { error } = await supabase.rpc('create_student_registration', {
      p_email: email,
      p_full_name: form.fullName,
      p_profile_photo_url: profilePhotoUrl,
      p_roll_number: form.rollNumber,
      p_department_name: form.departmentName,
      p_current_semester: Number(form.currentSemester),
      p_contact_number: form.contactNumber,
      p_pdpo_consent: form.pdpoConsent,
      p_academic_session: form.academicSession,
      p_present_address: form.presentAddress,
      p_permanent_address: form.permanentAddress,
    });

    if (error) {
      console.error('create_student_registration error:', error);
      throw new Error(error.message);
    }

    const verificationResult = await verifyStudentAgainstRoster({
      rollNumber: form.rollNumber,
      departmentName: form.departmentName,
      currentSemester: form.currentSemester,
      academicSession: form.academicSession,
    });

    return {
      user: activeUser,
      role: 'student',
      verificationResult,
      message:
        verificationResult?.verified === true
          ? 'Student registration completed and verified successfully.'
          : 'Registration submitted, but roster verification failed. Request sent to admin for manual review.',
    };
  }

  const documentPath = await uploadUniversityDocument({
    userId: activeUser.id,
    file: form.universityDocumentFile,
  });

  const { error } = await supabase.rpc('create_alumni_registration', {
    p_email: email,
    p_full_name: form.fullName,
    p_profile_photo_url: profilePhotoUrl,
    p_registration_no: form.registrationNo,
    p_graduation_year: Number(form.graduationYear),
    p_hall: form.hall,
    p_current_company: form.currentCompany || '',
    p_designation: form.designation || '',
    p_contact_number: form.contactNumber,
    p_verification_doc_url: documentPath,
    p_pdpo_consent: form.pdpoConsent,
    p_academic_session: form.academicSession,
    p_present_address: form.presentAddress,
    p_permanent_address: form.permanentAddress,
    p_department_name: form.departmentName,
  });

  if (error) {
    console.error('create_alumni_registration error:', error);
    throw new Error(error.message);
  }

  await createAlumniVerificationRequest({
    registrationNo: form.registrationNo,
    graduationYear: form.graduationYear,
    hall: form.hall,
    certificateStoragePath: documentPath,
  });

  return {
    user: activeUser,
    role: 'alumni',
    message:
      'Alumni registration submitted successfully. University document uploaded for admin verification.',
  };
}