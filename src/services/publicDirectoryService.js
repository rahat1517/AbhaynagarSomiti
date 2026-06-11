import { supabase } from '../lib/supabaseClient';

function cleanText(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveMemberType(memberType, occupation) {
  const directType = normalizeText(memberType);
  const normalizedOccupation = normalizeText(occupation);

  if (directType === 'student') return 'student';
  if (directType === 'alumni') return 'alumni';

  if (
    normalizedOccupation === 'student' ||
    normalizedOccupation === 'current student'
  ) {
    return 'student';
  }

  return 'alumni';
}

function getMemberTypeLabel(memberType) {
  return memberType === 'student' ? 'Current Student' : 'Alumni';
}

function mapPublicMember(row) {
  const memberType = resolveMemberType(row.member_type, row.occupation);

  return {
    ...row,

    id: row.profile_id || row.id,
    profile_id: row.profile_id || row.id,

    member_type: memberType,
    member_type_label: getMemberTypeLabel(memberType),

    full_name: row.full_name || '',
    profile_photo_url: row.profile_photo_url || '',

    university_degree: row.university_degree || '',
    university_subject: row.university_subject || '',
    department_name:
      row.department_name || row.university_subject || row.subject_department || '',

    first_year_admission_session: row.first_year_admission_session || '',
    academic_session:
      row.academic_session || row.first_year_admission_session || '',
    academic_year: row.academic_year || '',

    university_hall_name: row.university_hall_name || '',
    hall: row.hall || row.university_hall_name || '',

    occupation: row.occupation || '',
    professional_details: row.professional_details || '',
    organization_type: row.organization_type || '',
    organization_name: row.organization_name || '',
    current_company:
      row.current_company || row.organization_name || row.professional_details || '',
    designation: row.designation || '',
    work_section: row.work_section || '',

    union_pouroshova_name: row.union_pouroshova_name || '',
    ward_village_name: row.ward_village_name || '',
    para_moholla_name: row.para_moholla_name || '',
    present_address: row.present_address || '',

    created_at: row.created_at || null,

    // intentionally hidden from public UI
    email: '',
    contact_number: '',
  };
}

export async function listPublicMembers({
  role = '',
  academicSession = '',
  searchText = '',
} = {}) {
  const { data, error } = await supabase.rpc('public_list_members', {
    p_role: cleanText(role),
    p_academic_session: cleanText(academicSession),
    p_search_text: cleanText(searchText),
  });

  console.log('public_list_members data:', data);
  console.log('public_list_members error:', error);

  if (error) {
    console.error('public_list_members error:', error);
    throw new Error(error.message || 'Failed to load public members.');
  }

  return (data || []).map(mapPublicMember);
}

export async function getPublicMemberDetails(profileId) {
  if (!profileId) {
    throw new Error('Profile ID is required.');
  }

  const { data, error } = await supabase.rpc('get_directory_profile_details', {
    p_profile_id: profileId,
  });

  console.log('get_directory_profile_details data:', data);
  console.log('get_directory_profile_details error:', error);

  if (error) {
    console.error('get_directory_profile_details error:', error);
    throw new Error(error.message || 'Failed to load member details.');
  }

  if (!data) {
    throw new Error('Member details not found.');
  }

  return mapPublicMember(data);
}