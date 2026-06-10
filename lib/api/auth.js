import { supabase } from '../supabase';

export const signUp = async ({ email, password, name }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// Forgot-password flow (recovery OTP code, mobile-friendly).
// Step 1: email the user a recovery code.
export const requestPasswordReset = async ({ email }) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

// Verify the emailed code. On success this establishes a short-lived
// recovery session, which is what authorizes the updateUser call below.
export const verifyPasswordResetOtp = async ({ email, token }) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  if (error) throw error;
  return data;
};

// Set the new password for the recovery-authenticated user.
export const updatePassword = async ({ password }) => {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const deleteAccount = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const { error: rpcError } = await supabase.rpc('delete_current_user');
  if (rpcError) throw rpcError;

  await supabase.auth.signOut();
};
