import { supabase } from '../lib/supabaseClient';

export async function listPendingMembers() {
  const { data, error } = await supabase.rpc('admin_list_pending_members');

  if (error) {
    console.error('admin_list_pending_members error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function reviewMemberRegistration({
  profileId,
  status,
  adminRemarks,
}) {
  if (!profileId) {
    throw new Error('Profile ID is required.');
  }

  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid review status.');
  }

  const { data, error } = await supabase.rpc(
    'admin_review_member_registration',
    {
      p_profile_id: profileId,
      p_status: status,
      p_admin_remarks: adminRemarks || null,
    }
  );

  if (error) {
    console.error('admin_review_member_registration error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function listMemberUpdateRequests() {
  const { data, error } = await supabase.rpc(
    'admin_list_member_update_requests'
  );

  if (error) {
    console.error('admin_list_member_update_requests error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function reviewMemberUpdateRequest({
  requestId,
  status,
  adminRemarks,
}) {
  if (!requestId) {
    throw new Error('Request ID is required.');
  }

  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid review status.');
  }

  const { data, error } = await supabase.rpc(
    'admin_review_member_update_request',
    {
      p_request_id: requestId,
      p_status: status,
      p_admin_remarks: adminRemarks || null,
    }
  );

  if (error) {
    console.error('admin_review_member_update_request error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function getAdminNotificationSummary() {
  const [pendingMembers, updateRequests] = await Promise.all([
    listPendingMembers(),
    listMemberUpdateRequests(),
  ]);

  const pendingUpdates = updateRequests.filter(
    (item) => item.status === 'pending'
  );

  return {
    pendingMembers: pendingMembers.length,
    pendingUpdates: pendingUpdates.length,
    total: pendingMembers.length + pendingUpdates.length,
  };
}