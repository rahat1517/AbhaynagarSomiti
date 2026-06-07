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

  if (!data) {
    throw new Error('Profile data not found.');
  }

  if (data.profile_missing) {
    throw new Error(data.message || 'Profile row not found.');
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

export async function updateMyProfilePhoto(file) {
  if (!file) {
    throw new Error('Profile photo is required.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, or WEBP photo is allowed.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Profile photo must be 5MB or smaller.');
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

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${user.id}/${timestamp}-${safeFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('updateMyProfilePhoto upload error:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(uploadData.path);

  const photoUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      profile_photo_url: photoUrl,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('updateMyProfilePhoto db error:', updateError);
    throw new Error(updateError.message);
  }

  return {
    message: 'Profile photo updated successfully.',
    profile_photo_url: photoUrl,
  };
}