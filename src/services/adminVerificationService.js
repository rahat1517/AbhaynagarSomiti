import { supabase } from '../lib/supabaseClient';

export async function getPendingMemberRequests() {
  const { data, error } = await supabase.rpc('admin_list_member_requests');

  console.log('admin_list_member_requests data:', data);
  console.log('admin_list_member_requests error:', error);

  if (error) {
    console.error('admin_list_member_requests error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function approveMemberProfile(profileId) {
  if (!profileId) {
    throw new Error('Profile ID is required.');
  }

  const { data, error } = await supabase.rpc(
    'admin_update_member_verification',
    {
      p_profile_id: profileId,
      p_action: 'approved',
      p_reason: null,
    }
  );

  if (error) {
    console.error('approve member error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function rejectMemberProfile(profileId, reason = '') {
  if (!profileId) {
    throw new Error('Profile ID is required.');
  }

  const { data, error } = await supabase.rpc(
    'admin_update_member_verification',
    {
      p_profile_id: profileId,
      p_action: 'rejected',
      p_reason: reason || null,
    }
  );

  if (error) {
    console.error('reject member error:', error);
    throw new Error(error.message);
  }

  return data;
}