import { supabase } from '../lib/supabaseClient';

function emptyToNull(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createCareerPost(form) {
  const { data, error } = await supabase.rpc('create_career_post', {
    p_title: form.title,
    p_company_name: form.companyName,
    p_industry_vertical: form.industryVertical,
    p_job_type: form.jobType,
    p_location: form.location,
    p_is_remote: Boolean(form.isRemote),
    p_description: form.description,
    p_requirements: form.requirements,
    p_application_deadline: emptyToNull(form.applicationDeadline),
    p_external_apply_url: emptyToNull(form.externalApplyUrl),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function searchCareerPosts({ filters, cursor, limit = 20 }) {
  const { data, error } = await supabase.rpc('search_career_posts', {
    p_industry_vertical: emptyToNull(filters.industryVertical),
    p_job_type: emptyToNull(filters.jobType),
    p_location: emptyToNull(filters.location),
    p_search_text: emptyToNull(filters.searchText),
    p_limit: limit,
    p_cursor_created_at: cursor?.created_at || null,
    p_cursor_id: cursor?.id || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function applyToCareerPost({ careerPostId, coverMessage, resumeUrl }) {
  const { data, error } = await supabase.rpc('apply_to_career_post', {
    p_career_post_id: careerPostId,
    p_cover_message: coverMessage,
    p_resume_url: emptyToNull(resumeUrl),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMyCareerPostApplications() {
  const { data, error } = await supabase.rpc('get_my_career_post_applications');

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function updateJobApplicationStatus({ applicationId, status }) {
  const { data, error } = await supabase.rpc('update_job_application_status', {
    p_application_id: applicationId,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
