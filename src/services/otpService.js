const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!functionsUrl || !anonKey) {
  throw new Error('Missing Supabase Functions environment variables.');
}

export async function sendRegistrationOtp({ phoneNumber, userId }) {
  const response = await fetch(`${functionsUrl}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      action: 'send',
      phoneNumber,
      userId,
      purpose: 'registration',
    }),
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.message || 'Failed to send OTP.');
  }

  return result;
}

export async function verifyRegistrationOtp({ phoneNumber, otp }) {
  const response = await fetch(`${functionsUrl}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      action: 'verify',
      phoneNumber,
      otp,
      purpose: 'registration',
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'OTP verification failed.');
  }

  return result;
}