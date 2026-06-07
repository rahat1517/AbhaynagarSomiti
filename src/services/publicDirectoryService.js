import { supabase } from '../lib/supabaseClient';

function emptyToNull(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listPublicMembers(filters = {}) {
  const { data, error } = await supabase.rpc('public_list_members', {
    p_role: emptyToNull(filters.role),
    p_academic_session: emptyToNull(filters.academicSession),
    p_search_text: emptyToNull(filters.searchText),
  });

  if (error) {
    console.error('public_list_members error:', error);
    throw new Error(error.message);
  }

  return data || [];
}