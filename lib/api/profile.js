import { supabase } from '../supabase';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

export const getMyProfile = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getProfile = async (profileId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, about')
    .eq('id', profileId)
    .single();
  if (error) throw error;
  return data;
};

export const updateMyProfile = async ({ name, notes, about, phone }) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('profiles')
    .update({ name, notes, about, phone })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
