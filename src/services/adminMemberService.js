import { supabase } from '../lib/supabaseClient';

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function parseDegreeQualifications(profile) {
  const data =
    profile?.degree_qualifications ||
    profile?.member_degree_qualifications ||
    profile?.academic_qualifications ||
    [];

  if (Array.isArray(data)) return data;

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getBachelorDegree(member, degrees) {
  return (
    member?.bachelor_degree_name ||
    degrees.find((item) => {
      const level = cleanText(
        item.degree_level || item.degreeLevel
      ).toLowerCase();

      return level === 'bachelor';
    })?.degree_name ||
    degrees.find((item) => {
      const name = cleanText(item.degree_name || item.degreeName);

      return ['BSc', 'BBA', 'BA', 'BSS', 'LLB'].includes(name);
    })?.degree_name ||
    ''
  );
}

function getBachelorDepartment(member, degrees) {
  return (
    member?.department_name ||
    degrees.find((item) => {
      const level = cleanText(
        item.degree_level || item.degreeLevel
      ).toLowerCase();

      return level === 'bachelor';
    })?.subject_department ||
    degrees.find((item) => {
      const name = cleanText(item.degree_name || item.degreeName);

      return ['BSc', 'BBA', 'BA', 'BSS', 'LLB'].includes(name);
    })?.subject_department ||
    ''
  );
}

function mapMemberForAdminPage(member) {
  const degrees = parseDegreeQualifications(member);
  const isStudent = cleanText(member?.occupation).toLowerCase() === 'student';

  return {
    ...member,

    id: member.id,
    profile_id: member.id,

    role: isStudent ? 'student' : 'alumni',
    member_type: isStudent ? 'student' : 'alumni',

    hall: member.university_hall_name,
    academic_session: member.first_year_admission_session,

    bachelor_degree_name: getBachelorDegree(member, degrees),
    department_name: getBachelorDepartment(member, degrees),

    degree_qualifications: degrees,
    member_degree_qualifications: degrees,
    academic_qualifications: degrees,
  };
}

export async function listPendingMembers() {
  const { data, error } = await supabase
    .from('member_full_details')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listPendingMembers error:', error);
    throw new Error(error.message || 'Failed to load pending members.');
  }

  return (data || []).map(mapMemberForAdminPage);
}

export async function listApprovedMembers() {
  const { data, error } = await supabase
    .from('member_full_details')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listApprovedMembers error:', error);
    throw new Error(error.message || 'Failed to load approved members.');
  }

  return (data || []).map(mapMemberForAdminPage);
}

export async function getMemberDetails(memberId) {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const { data, error } = await supabase
    .from('member_full_details')
    .select('*')
    .eq('id', memberId)
    .maybeSingle();

  if (error) {
    console.error('getMemberDetails error:', error);
    throw new Error(error.message || 'Failed to load member details.');
  }

  if (!data) {
    throw new Error('Member details not found.');
  }

  return mapMemberForAdminPage(data);
}

export async function approveMember(memberId) {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const { error } = await supabase.rpc('approve_member_registration', {
    p_member_id: memberId,
  });

  if (error) {
    console.error('approveMember error:', error);
    throw new Error(error.message || 'Failed to approve member.');
  }

  return {
    message: 'Member approved successfully.',
  };
}

export async function rejectMember(memberId, reason = '') {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const { error } = await supabase.rpc('reject_member_registration', {
    p_member_id: memberId,
    p_reason: reason || null,
  });

  if (error) {
    console.error('rejectMember error:', error);
    throw new Error(error.message || 'Failed to reject member.');
  }

  return {
    message: 'Member rejected successfully.',
  };
}

export async function reviewMemberRegistration(memberId, action, reason = '') {
  const finalAction = cleanText(action).toLowerCase();

  if (finalAction === 'approved' || finalAction === 'approve') {
    return approveMember(memberId);
  }

  if (finalAction === 'rejected' || finalAction === 'reject') {
    return rejectMember(memberId, reason);
  }

  throw new Error('Invalid review action.');
}

export async function updateMemberPublicVisibility(memberId, isPublic) {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const { error } = await supabase
    .from('member_registrations')
    .update({
      is_public: Boolean(isPublic),
    })
    .eq('id', memberId);

  if (error) {
    console.error('updateMemberPublicVisibility error:', error);
    throw new Error(error.message || 'Failed to update public visibility.');
  }

  return {
    message: 'Public visibility updated successfully.',
  };
}

export async function deleteMember(memberId) {
  if (!memberId) {
    throw new Error('Member ID is required.');
  }

  const { error } = await supabase
    .from('member_registrations')
    .delete()
    .eq('id', memberId);

  if (error) {
    console.error('deleteMember error:', error);
    throw new Error(error.message || 'Failed to delete member.');
  }

  return {
    message: 'Member deleted successfully.',
  };
}

export async function getAdminNotificationSummary() {
  const { count: pendingCount, error } = await supabase
    .from('member_registrations')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'pending');

  if (error) {
    console.error('getAdminNotificationSummary error:', error);
    throw new Error(
      error.message || 'Failed to load admin notification summary.'
    );
  }

  const totalPending = pendingCount || 0;

  return {
    pendingMembers: totalPending,
    pendingMemberRegistrations: totalPending,
    pendingUpdateRequests: totalPending,
    total: totalPending,
  };
}

/*
  Old/import compatibility exports
  Project-er different page different function name import korle
  ei alias gulo import error prevent korbe.
*/

export const getPendingMemberRequests = listPendingMembers;

export const admin_list_pending_member_registrations = listPendingMembers;
export const admin_list_pending_members = listPendingMembers;
export const admin_list_pending_member = listPendingMembers;

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
export const admin_update_member_public_visibility =
  updateMemberPublicVisibility;
export const admin_delete_member = deleteMember;



export const listMemberUpdateRequests = listPendingMembers;
export const getMemberUpdateRequestDetails = getMemberDetails;

export async function reviewMemberUpdateRequest(memberId, action, reason = '') {
  return reviewMemberRegistration(memberId, action, reason);
}

export const approveMemberUpdateRequest = approveMember;
export const rejectMemberUpdateRequest = rejectMember;