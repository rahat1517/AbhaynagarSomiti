import { supabase } from '../lib/supabaseClient';
import {
  getMemberTypeLabel,
  mapProfileRow,
} from './directoryService';

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function mapPendingMember(member) {
  const mapped = mapProfileRow(member);

  return {
    ...mapped,
    id: member.id,
    profile_id: member.id,
    member_type_label: getMemberTypeLabel(mapped.member_type),
    registration_date: member.created_at,
  };
}

export async function listPendingMembers() {
  const { data, error } = await supabase.rpc(
    'admin_list_pending_member_requests'
  );

  if (error) {
    console.error('admin_list_pending_member_requests error:', error);
    throw new Error(error.message || 'Failed to load pending members.');
  }

  return (data || []).map(mapPendingMember);
}

export async function listApprovedMembers() {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listApprovedMembers error:', error);
    throw new Error(error.message || 'Failed to load approved members.');
  }

  return (data || []).map(mapPendingMember);
}

export async function getMemberDetails(memberId) {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const { data, error } = await supabase.rpc('get_member_profile_details', {
    p_profile_id: memberId,
  });

  if (error) {
    console.error('get_member_profile_details error:', error);
    throw new Error(error.message || 'Failed to load member details.');
  }

  if (!data) {
    throw new Error('Member details not found.');
  }

  return mapPendingMember(data);
}

async function updateMemberVerification(memberId, action, reason = '') {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const finalAction = cleanText(action).toLowerCase();

  if (
    finalAction !== 'approved' &&
    finalAction !== 'approve' &&
    finalAction !== 'rejected' &&
    finalAction !== 'reject'
  ) {
    throw new Error('Invalid review action.');
  }

  const rpcAction =
    finalAction === 'approved' || finalAction === 'approve'
      ? 'approved'
      : 'rejected';

  const { data, error } = await supabase.rpc('admin_update_member_verification', {
    p_profile_id: memberId,
    p_action: rpcAction,
    p_reason: reason || null,
  });

  if (error) {
    console.error('admin_update_member_verification error:', error);
    throw new Error(error.message || 'Failed to update member verification.');
  }

  return {
    success: true,
    data,
    message:
      rpcAction === 'approved'
        ? 'Member approved successfully.'
        : 'Member rejected successfully.',
  };
}

export async function approveMember(memberId) {
  return updateMemberVerification(memberId, 'approved');
}

export async function rejectMember(memberId, reason = '') {
  return updateMemberVerification(memberId, 'rejected', reason);
}

export async function reviewMemberRegistration(
  memberIdOrOptions,
  action,
  reason = ''
) {
  let memberId = memberIdOrOptions;
  let finalAction = action;
  let finalReason = reason;

  if (memberIdOrOptions && typeof memberIdOrOptions === 'object') {
    memberId = memberIdOrOptions.profileId;
    finalAction = memberIdOrOptions.status;
    finalReason = memberIdOrOptions.adminRemarks || '';
  }

  return updateMemberVerification(memberId, finalAction, finalReason);
}

export async function getAdminNotificationSummary() {
  const { data, error } = await supabase.rpc(
    'admin_pending_member_request_count'
  );

  if (error) {
    console.error('admin_pending_member_request_count error:', error);
    throw new Error(
      error.message || 'Failed to load admin notification summary.'
    );
  }

  const pendingMembers = Number(data) || 0;

  return {
    pendingMembers,
    pendingMemberRegistrations: pendingMembers,
    pendingUpdateRequests: 0,
    total: pendingMembers,
  };
}

export const getPendingMemberRequests = listPendingMembers;
export const admin_list_pending_member_registrations = listPendingMembers;
export const admin_list_pending_members = listPendingMembers;
export const loadPendingMembers = listPendingMembers;
export const fetchPendingMembers = listPendingMembers;
export const reviewMember = reviewMemberRegistration;
export const approvePendingMember = approveMember;
export const rejectPendingMember = rejectMember;
export const approveMemberProfile = approveMember;
export const rejectMemberProfile = rejectMember;
export const admin_get_member_details = getMemberDetails;
export const admin_approve_member = approveMember;
export const admin_reject_member = rejectMember;

export const listMemberUpdateRequests = listPendingMembers;
export const getMemberUpdateRequestDetails = getMemberDetails;

export async function reviewMemberUpdateRequest(memberId, action, reason = '') {
  return reviewMemberRegistration(memberId, action, reason);
}

export const approveMemberUpdateRequest = approveMember;
export const rejectMemberUpdateRequest = rejectMember;
