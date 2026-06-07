import { supabase } from '../lib/supabaseClient';

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function searchDirectoryProfiles({
  filters = {},
  cursor = null,
  limit = 20,
} = {}) {
  const { data, error } = await supabase.rpc('search_directory_profiles', {
    p_role: emptyToNull(filters.role),
    p_department_name: emptyToNull(filters.departmentName),
    p_batch: emptyToNull(filters.batch),
    p_graduation_year: numberOrNull(filters.graduationYear),
    p_current_company: emptyToNull(filters.currentCompany),
    p_designation: emptyToNull(filters.designation),
    p_search_text: emptyToNull(filters.searchText),
    p_limit: limit,
    p_cursor_created_at: cursor?.created_at || null,
    p_cursor_id: cursor?.profile_id || null,
    p_academic_session: emptyToNull(filters.academicSession),
  });

  if (error) {
    console.error('search_directory_profiles error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getDirectoryProfileDetails(profileId) {
  if (!profileId) {
    throw new Error('Profile ID is required.');
  }

  const { data, error } = await supabase.rpc(
    'get_directory_profile_details',
    {
      p_profile_id: profileId,
    }
  );

  if (error) {
    console.error('get_directory_profile_details error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateMyVisibilityPreferences({
  showEmail = false,
  showContactNumber = false,
  contactVisibility = 'private',
} = {}) {
  const { data, error } = await supabase.rpc(
    'update_my_visibility_preferences',
    {
      p_show_email: Boolean(showEmail),
      p_show_contact_number: Boolean(showContactNumber),
      p_contact_visibility: form.contactVisibility || 'verified_members',
    }
  );

  if (error) {
    console.error('update_my_visibility_preferences error:', error);
    throw new Error(error.message);
  }

  return data;
}