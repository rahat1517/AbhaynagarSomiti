import { supabase } from '../lib/supabaseClient';

function emptyToNull(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function listAcademicRoster(filters = {}) {
  const { data, error } = await supabase.rpc('admin_list_academic_roster', {
    p_search_text: emptyToNull(filters.searchText),
    p_department_name: emptyToNull(filters.departmentName),
    p_academic_session: emptyToNull(filters.academicSession),
    p_is_active:
      filters.isActive === ''
        ? null
        : filters.isActive === true || filters.isActive === 'true',
  });

  if (error) {
    console.error('admin_list_academic_roster error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function saveAcademicRoster(form) {
  const { data, error } = await supabase.rpc('admin_upsert_academic_roster', {
    p_roster_id: form.id || null,
    p_roll_number: emptyToNull(form.rollNumber),
    p_email: emptyToNull(form.email),
    p_full_name: emptyToNull(form.fullName),
    p_department_name: emptyToNull(form.departmentName),
    p_current_semester: numberOrNull(form.currentSemester),
    p_academic_session: emptyToNull(form.academicSession),
    p_is_active: Boolean(form.isActive),
  });

  if (error) {
    console.error('admin_upsert_academic_roster error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAcademicRoster(rosterId) {
  const { data, error } = await supabase.rpc('admin_delete_academic_roster', {
    p_roster_id: rosterId,
  });

  if (error) {
    console.error('admin_delete_academic_roster error:', error);
    throw new Error(error.message);
  }

  return data;
}