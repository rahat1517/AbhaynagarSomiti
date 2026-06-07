import { supabase } from '../lib/supabaseClient';

export async function listStudentVerificationRequests() {
  const { data, error } = await supabase.rpc(
    'admin_list_student_verification_requests'
  );

  if (error) {
    console.error('admin_list_student_verification_requests error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function reviewStudentVerificationRequest({
  requestId,
  status,
  adminRemarks,
}) {
  const { data, error } = await supabase.rpc(
    'admin_review_student_verification_request',
    {
      p_request_id: requestId,
      p_status: status,
      p_admin_remarks: adminRemarks || null,
    }
  );

  if (error) {
    console.error('admin_review_student_verification_request error:', error);
    throw new Error(error.message);
  }

  return data;
}