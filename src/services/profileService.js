import { supabase } from '../lib/supabaseClient';

function emptyToNull(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getMyProfileDetails() {
  const { data, error } = await supabase.rpc('get_my_profile_details');

  if (error) {
    console.error('get_my_profile_details error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateMyProfileDetails(form) {
  const { data, error } = await supabase.rpc('update_my_profile_details', {
    p_contact_number: emptyToNull(form.contactNumber),
    p_academic_session: emptyToNull(form.academicSession),
    p_present_address: emptyToNull(form.presentAddress),
    p_permanent_address: emptyToNull(form.permanentAddress),
    p_current_company: emptyToNull(form.currentCompany),
    p_designation: emptyToNull(form.designation),
    p_show_email: Boolean(form.showEmail),
    p_show_contact_number: Boolean(form.showContactNumber),
    p_contact_visibility: form.contactVisibility || 'private',
  });

  if (error) {
    console.error('update_my_profile_details error:', error);
    throw new Error(error.message);
  }

  return data;
}