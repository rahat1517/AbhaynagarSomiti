import { supabase } from '../lib/supabaseClient';

function emptyToNull(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function matchText(source, keyword) {
  if (!keyword) return true;

  return normalizeText(source).includes(normalizeText(keyword));
}

export function resolveMemberType(memberType) {
  const normalized = normalizeText(memberType);

  if (normalized === 'student') return 'student';
  if (normalized === 'alumni') return 'alumni';

  return 'member';
}

export function getMemberTypeLabel(memberType) {
  const resolved = resolveMemberType(memberType);

  if (resolved === 'student') return 'Current Student';
  if (resolved === 'alumni') return 'Alumni';

  return 'Member';
}

export function mapProfileRow(row) {
  const memberType = resolveMemberType(row.member_type);

  return {
    ...row,

    profile_id: row.profile_id || row.id,
    member_type: memberType,
    member_type_label: getMemberTypeLabel(memberType),
    directory_role: memberType,

    full_name: row.full_name,
    profile_photo_url: row.profile_photo_url,

    department_name:
      row.department_name ||
      row.university_subject ||
      row.subject_department ||
      '',

    academic_session:
      row.academic_session ||
      row.first_year_admission_session ||
      row.session ||
      '',

    academic_year: row.academic_year || '',

    hall:
      row.hall ||
      row.university_hall_name ||
      '',

    occupation: row.occupation || '',
    professional_details: row.professional_details || row.current_company || '',
    current_company: row.current_company || row.professional_details || '',
    designation: row.designation || row.occupation || '',

    is_verified: true,
    created_at: row.created_at || null,
  };
}

function applyClientFilters(rows, filters = {}) {
  const role = emptyToNull(filters.role);
  const searchText = emptyToNull(filters.searchText);
  const departmentName = emptyToNull(filters.departmentName);
  const hall = emptyToNull(filters.hall);
  const currentCompany = emptyToNull(filters.currentCompany);
  const designation = emptyToNull(filters.designation);
  const graduationYear = emptyToNull(filters.graduationYear);

  return rows.filter((item) => {
    if (role && item.member_type !== role) return false;

    if (departmentName && !matchText(item.department_name, departmentName)) {
      return false;
    }

    if (hall && !matchText(item.hall, hall)) {
      return false;
    }

    if (
      graduationYear &&
      !matchText(item.academic_year, graduationYear) &&
      !matchText(item.academic_session, graduationYear)
    ) {
      return false;
    }

    if (currentCompany && !matchText(item.current_company, currentCompany)) {
      return false;
    }

    if (designation && !matchText(item.designation, designation)) {
      return false;
    }

    if (searchText) {
      const searchableText = [
        item.full_name,
        item.department_name,
        item.academic_session,
        item.hall,
        item.occupation,
        item.professional_details,
        item.current_company,
        item.designation,
      ]
        .filter(Boolean)
        .join(' ');

      if (!matchText(searchableText, searchText)) return false;
    }

    return true;
  });
}

export async function searchDirectoryProfiles({
  filters = {},
  cursor = null,
  limit = 20,
} = {}) {
  const { data, error } = await supabase.rpc('public_list_members', {
    p_role: emptyToNull(filters.role),
    p_academic_session: emptyToNull(filters.graduationYear),
    p_search_text: emptyToNull(filters.searchText),
  });

  if (error) {
    console.error('public_list_members error:', error);
    throw new Error(error.message);
  }

  const mappedRows = (data || []).map(mapProfileRow);
  const filteredRows = applyClientFilters(mappedRows, filters);

  if (!cursor?.profile_id) {
    return filteredRows.slice(0, limit);
  }

  const cursorIndex = filteredRows.findIndex(
    (item) => item.profile_id === cursor.profile_id
  );

  if (cursorIndex === -1) {
    return [];
  }

  return filteredRows.slice(cursorIndex + 1, cursorIndex + 1 + limit);
}

export async function getDirectoryProfileDetails(profileId) {
  if (!profileId) {
    throw new Error('Profile ID is required.');
  }

  const { data, error } = await supabase.rpc('get_directory_profile_details', {
    p_profile_id: profileId,
  });

  if (error) {
    console.error('get_directory_profile_details error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Profile details not found.');
  }

  return mapProfileRow(data);
}

export async function updateMyVisibilityPreferences({
  showEmail = false,
  showContactNumber = false,
  contactVisibility = 'verified_members',
} = {}) {
  const { data, error } = await supabase.rpc(
    'update_my_visibility_preferences',
    {
      p_show_email: Boolean(showEmail),
      p_show_contact_number: Boolean(showContactNumber),
      p_contact_visibility: contactVisibility || 'verified_members',
    }
  );

  if (error) {
    console.error('update_my_visibility_preferences error:', error);
    throw new Error(error.message);
  }

  return data;
}