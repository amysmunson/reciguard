import { supabase } from '../supabase';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

// Limits on what the app will submit. The form enforces the length too; this
// is the backstop for anything calling the API directly.
export const FEEDBACK_MAX_LENGTH = 2000;
export const FEEDBACK_TYPES = ['suggestion'];

// Submit-only — there is no corresponding "get my feedback" function
export const submitFeedback = async ({ type, message }) => {
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text) throw new Error('Feedback is empty.');
  if (text.length > FEEDBACK_MAX_LENGTH) {
    throw new Error(`Feedback can be at most ${FEEDBACK_MAX_LENGTH} characters.`);
  }
  if (!FEEDBACK_TYPES.includes(type)) throw new Error('Unknown feedback type.');
  const user = await requireUser();
  const { error } = await supabase.from('feedback_submissions').insert({
    user_id: user.id,
    type,
    message: text,
  });
  if (error) throw error;
};
