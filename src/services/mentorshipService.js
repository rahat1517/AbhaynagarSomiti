import { supabase } from '../lib/supabaseClient';

export async function requestMentorship({ alumniId, topic, message }) {
  const { data, error } = await supabase.rpc('request_mentorship', {
    p_alumni_id: alumniId,
    p_topic: topic,
    p_message: message,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMyMentorshipRelations() {
  const { data, error } = await supabase.rpc('get_my_mentorship_relations');

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function respondToMentorshipRequest({ relationId, status }) {
  const { data, error } = await supabase.rpc(
    'respond_to_mentorship_request',
    {
      p_relation_id: relationId,
      p_status: status,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}