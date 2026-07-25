import { supabase } from '../supabase';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

// Submit-only — there is no corresponding "get my feedback" function
export const submitFeedback = async ({ type, message }) => {
  const user = await requireUser();
  const { error } = await supabase.from('feedback_submissions').insert({
    user_id: user.id,
    type,
    message,
  });
  if (error) throw error;
};
