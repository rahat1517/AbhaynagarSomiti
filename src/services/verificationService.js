import { supabase } from '../lib/supabaseClient';

export async function verifyStudentAgainstRoster({
  rollNumber,
  departmentName,
  currentSemester,
  academicSession,
}) {
  const { data, error } = await supabase.rpc('verify_student_against_roster', {
    p_roll_number: rollNumber,
    p_department_name: departmentName,
    p_current_semester: Number(currentSemester),
    p_academic_session: academicSession,
  });

  if (error) {
    console.error('verify_student_against_roster error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function uploadAlumniCertificatePdf({ userId, file }) {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  if (!file) {
    throw new Error('Certificate PDF is required.');
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('PDF must be 10MB or smaller.');
  }

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${timestamp}-${safeFileName}`;

  const { data, error } = await supabase.storage
    .from('alumni-certificates')
    .upload(storagePath, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('uploadAlumniCertificatePdf error:', error);
    throw new Error(error.message);
  }

  return data.path;
}

export async function createAlumniVerificationRequest({
  registrationNo,
  graduationYear,
  batch,
  certificateStoragePath,
}) {
  const { data, error } = await supabase.rpc(
    'create_alumni_verification_request',
    {
      p_registration_no: registrationNo,
      p_graduation_year: Number(graduationYear),
      p_batch: batch,
      p_certificate_storage_path: certificateStoragePath,
    }
  );

  if (error) {
    console.error('create_alumni_verification_request error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function listAlumniVerificationRequests() {
  const { data, error } = await supabase
    .from('alumni_verification_requests')
    .select(
      `
      id,
      alumni_id,
      registration_no,
      graduation_year,
      batch,
      certificate_storage_path,
      status,
      admin_remarks,
      reviewed_by,
      reviewed_at,
      created_at
      `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listAlumniVerificationRequests error:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getSignedCertificateUrl(storagePath) {
  if (!storagePath) {
    throw new Error('Certificate storage path is required.');
  }

  const { data, error } = await supabase.storage
    .from('alumni-certificates')
    .createSignedUrl(storagePath, 60);

  if (error) {
    console.error('getSignedCertificateUrl error:', error);
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function reviewAlumniVerificationRequest({
  requestId,
  status,
  adminRemarks,
}) {
  const { data, error } = await supabase.rpc(
    'review_alumni_verification_request',
    {
      p_request_id: requestId,
      p_status: status,
      p_admin_remarks: adminRemarks || null,
    }
  );

  if (error) {
    console.error('review_alumni_verification_request error:', error);
    throw new Error(error.message);
  }

  return data;
}
export async function uploadProfilePhoto({ userId, file }) {
  if (!userId) {
    throw new Error('User ID is required.');
  }

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

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${timestamp}-${safeFileName}`;

  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('uploadProfilePhoto error:', error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export async function uploadUniversityDocument({ userId, file }) {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  if (!file) {
    throw new Error('University document is required.');
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PDF, JPG, PNG, or WEBP university document is allowed.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('University document must be 10MB or smaller.');
  }

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${timestamp}-${safeFileName}`;

  const { data, error } = await supabase.storage
    .from('university-documents')
    .upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('uploadUniversityDocument error:', error);
    throw new Error(error.message);
  }

  return data.path;
}

export async function getSignedUniversityDocumentUrl(storagePath) {
  if (!storagePath) {
    throw new Error('Document storage path is required.');
  }

  const { data, error } = await supabase.storage
    .from('university-documents')
    .createSignedUrl(storagePath, 60);

  if (error) {
    console.error('getSignedUniversityDocumentUrl error:', error);
    throw new Error(error.message);
  }

  return data.signedUrl;
}