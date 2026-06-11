import { supabase } from '../lib/supabaseClient';
import { uploadProfilePhoto } from './verificationService';

function emptyToNull(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isStudentOccupation(occupation) {
  return String(occupation || '').trim().toLowerCase() === 'student';
}

function mapDegreeQualifications(qualifications) {
  if (!Array.isArray(qualifications)) return [];

  return qualifications
    .filter((item) => {
      return (
        String(item.degree_name || item.degreeName || '').trim() ||
        String(item.institution_name || item.institutionName || '').trim() ||
        String(item.passing_year || item.passingYear || '').trim() ||
        String(item.subject_department || item.subjectDepartment || '').trim()
      );
    })
    .map((item) => ({
      degree_name:
        String(item.degree_name || item.degreeName || '').trim() || 'Other',
      institution_name: String(
        item.institution_name || item.institutionName || ''
      ).trim(),
      passing_year: String(item.passing_year || item.passingYear || '').trim(),
      subject_department: String(
        item.subject_department || item.subjectDepartment || ''
      ).trim(),
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

    university_degree: emptyToNull(form.universityDegree),
    university_hall_name: emptyToNull(form.universityHallName),
    first_year_admission_session: emptyToNull(form.firstYearAdmissionSession),
    university_subject: emptyToNull(form.universitySubject),
    member_type: emptyToNull(form.memberType),
    academic_year: emptyToNull(form.academicYear),

    ssc_institution_name: emptyToNull(form.sscInstitutionName),
    ssc_group: emptyToNull(form.sscGroup),
    ssc_passing_year: emptyToNull(form.sscPassingYear),

    hsc_institution_name: emptyToNull(form.hscInstitutionName),
    hsc_group: emptyToNull(form.hscGroup),
    hsc_passing_year: emptyToNull(form.hscPassingYear),

    degree_qualifications: mapDegreeQualifications(form.degreeQualifications),

    union_pouroshova_name: emptyToNull(form.unionPouroshovaName),
    ward_village_name: emptyToNull(form.wardVillageName),
    para_moholla_name: emptyToNull(form.paraMohollaName),

    present_address: emptyToNull(form.presentAddress),

    occupation: emptyToNull(form.occupation),
    professional_details: studentOccupation
      ? null
      : emptyToNull(form.professionalDetails),

    organization_type: studentOccupation
      ? null
      : emptyToNull(form.organizationType),

    organization_name: studentOccupation
      ? null
      : emptyToNull(form.organizationName),

    designation: studentOccupation ? null : emptyToNull(form.designation),

    work_section: studentOccupation ? null : emptyToNull(form.workSection),

    organization_address: studentOccupation
      ? null
      : emptyToNull(form.organizationAddress),

    life_story: emptyToNull(form.lifeStory),
  };

  console.log('Profile update requestedData:', requestedData);

  const { data, error } = await supabase.rpc('request_member_profile_update', {
    p_requested_data: requestedData,
  });

  console.log('Profile update response data:', data);
  console.log('Profile update response error:', error);

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