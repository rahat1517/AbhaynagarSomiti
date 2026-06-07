import { supabase } from '../lib/supabaseClient';

const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function getMyPersonalDataInventory() {
  const { data, error } = await supabase.rpc('get_my_personal_data_inventory');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function requestPermanentAccountDeletion({
  reason,
  confirmationText,
}) {
  if (!functionsUrl || !anonKey) {
    throw new Error('Supabase Functions environment variables are missing.');
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    throw new Error('You must be logged in to delete your account.');
  }

  const response = await fetch(`${functionsUrl}/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      reason,
      confirmationText,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error || 'Account deletion failed.');
  }

  await supabase.auth.signOut();

  return result;
}

export function downloadPersonalDataJson(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {
    type: 'application/json;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `personal-data-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}