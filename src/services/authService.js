import { supabase } from '../lib/supabaseClient';

function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

async function getProfileByUserId(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function createMissingProfile(user) {
  if (!user?.id) {
    throw new Error('User information is missing.');
  }

  const payload = {
    id: user.id,
    email: cleanEmail(user.email),
    role: 'user',
    full_name: cleanText(user.user_metadata?.full_name),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, {
      onConflict: 'id',
    })
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithEmail(email, password) {
  const finalEmail = cleanEmail(email);

  if (!finalEmail) {
    throw new Error('Email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: finalEmail,
      password,
    });

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData?.user;

  if (!user?.id) {
    throw new Error('Login failed. User not found.');
  }

  let profile = await getProfileByUserId(user.id);

  if (!profile) {
    profile = await createMissingProfile(user);
  }

  return {
    user,
    profile,
    session: authData.session,
  };
}

export async function signUpWithEmail(email, password, fullName = '') {
  const finalEmail = cleanEmail(email);

  if (!finalEmail) {
    throw new Error('Email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: finalEmail,
    password,
    options: {
      data: {
        full_name: cleanText(fullName),
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData?.user;

  let profile = null;

  if (user?.id) {
    profile = await createMissingProfile(user);
  }

  return {
    user,
    profile,
    session: authData.session,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return null;
  }

  let profile = await getProfileByUserId(user.id);

  if (!profile) {
    profile = await createMissingProfile(user);
  }

  return profile;
}

export async function sendMagicLink(email) {
  const finalEmail = cleanEmail(email);

  if (!finalEmail) {
    throw new Error('Email is required.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: finalEmail,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export const signInWithEmailPassword = signInWithEmail;
export const signUpWithEmailPassword = signUpWithEmail;