import { supabase } from '../lib/supabaseClient';
import {
  uploadProfilePhoto,
  uploadUniversityDocument,
} from './verificationService';

function emptyToNull(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isStudentOccupation(occupation) {
  return String(occupation || '').trim().toLowerCase() === 'student';
}

function mapAcademicQualifications(qualifications) {
  if (!Array.isArray(qualifications)) return [];

  return qualifications
    .filter((item) => {
      return (
        String(item.degree_name || item.degreeName || '').trim() ||
        String(item.institution_name || item.institutionName || '').trim() ||
        String(item.passing_year || item.passingYear || '').trim() ||
        String(item.subject_department || item.subjectDepartment || '').trim() ||
        String(item.academic_degree_name || item.academicDegreeName || '').trim()
      );
    })
    .map((item) => ({
      degree_name: String(item.degree_name || item.degreeName || '').trim() || 'Other',
      institution_name: String(item.institution_name || item.institutionName || '').trim(),
      passing_year: String(item.passing_year || item.passingYear || '').trim(),
      subject_department: String(item.subject_department || item.subjectDepartment || '').trim(),
      academic_degree_name: String(
        item.academic_degree_name || item.academicDegreeName || ''
      ).trim(),
      gpa: String(item.gpa || '').trim(),
    }));
}

export async function getMyProfileDetails() {
  const { data, error } = await supabase.rpc('get_my_member_profile');

  if (error) {
    console.error('get_my_member_profile error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Profile data not found.');
  }

  if (data.profile_missing) {
    throw new Error(data.message || 'Profile row not found.');
  }

  return data;
}

export async function requestMyProfileUpdate(form) {
  const studentOccupation = isStudentOccupation(form.occupation);

  const requestedData = {
    full_name: emptyToNull(form.fullName),
    nick_name: emptyToNull(form.nickName),
    date_of_birth: emptyToNull(form.dateOfBirth),
    gender: emptyToNull(form.gender),
    blood_group: emptyToNull(form.bloodGroup),

    contact_number: emptyToNull(form.contactNumber),
    facebook_profile_link: emptyToNull(form.facebookProfileLink),

    university_hall_name: emptyToNull(form.universityHallName),
    first_year_admission_session: emptyToNull(form.firstYearAdmissionSession),
    university_subject: emptyToNull(form.universitySubject),

    union_pouroshova_name: emptyToNull(form.unionPouroshovaName),
    ward_village_name: emptyToNull(form.wardVillageName),
    para_moholla_name: emptyToNull(form.paraMohollaName),

    present_address: emptyToNull(form.presentAddress),

    occupation: emptyToNull(form.occupation),
    professional_details: studentOccupation
      ? null
      : emptyToNull(form.professionalDetails),

    life_story: emptyToNull(form.lifeStory),

    academic_qualifications: mapAcademicQualifications(
      form.academicQualifications
    ),
  };

  const { data, error } = await supabase.rpc('request_member_profile_update', {
    p_requested_data: requestedData,
  });

  if (error) {
    console.error('request_member_profile_update error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function requestMyProfilePhotoUpdate(file) {
  if (!file) {
    throw new Error('Profile photo is required.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user?.id) {
    throw new Error('Authentication required.');
  }

  const profilePhotoUrl = await uploadProfilePhoto({
    userId: user.id,
    file,
  });

  const { data, error } = await supabase.rpc('request_member_profile_update', {
    p_requested_data: {
      profile_photo_url: profilePhotoUrl,
    },
  });

  if (error) {
    console.error('request profile photo update error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function requestMyUniversityDocumentUpdate(file) {
  if (!file) {
    throw new Error('University document is required.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user?.id) {
    throw new Error('Authentication required.');
  }

  const documentPath = await uploadUniversityDocument({
    userId: user.id,
    file,
  });

  const { data, error } = await supabase.rpc('request_member_profile_update', {
    p_requested_data: {
      university_document_url: documentPath,
    },
  });

  if (error) {
    console.error('request university document update error:', error);
    throw new Error(error.message);
  }

  return data;
}