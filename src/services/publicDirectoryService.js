import { supabase } from '../lib/supabaseClient';

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

export async function public_list_members(filters = {}) {
  const searchText = cleanText(filters.searchText || filters.search);

  let query = supabase
    .from('public_member_directory')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchText) {
    query = query.or(
      [
        `full_name.ilike.%${searchText}%`,
        `department_name.ilike.%${searchText}%`,
        `university_hall_name.ilike.%${searchText}%`,
        `hall.ilike.%${searchText}%`,
        `academic_session.ilike.%${searchText}%`,
        `occupation.ilike.%${searchText}%`,
      ].join(',')
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('public_list_members error:', error);
    throw new Error(error.message || 'Failed to load public members.');
  }

  return data || [];
}

export async function searchPublicMembers(filters = {}) {
  return public_list_members(filters);
}

export async function listPublicMembers(filters = {}) {
  return public_list_members(filters);
}