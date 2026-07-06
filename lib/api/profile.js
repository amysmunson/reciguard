import { supabase } from '../supabase';
import { invalidate } from '../cache';

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

export const updateMyProfile = async ({ name, notes, about, phone, contrast }) => {
  const user = await requireUser();
  const patch = {};
  if (typeof name !== 'undefined') patch.name = name;
  if (typeof notes !== 'undefined') patch.notes = notes;
  if (typeof about !== 'undefined') patch.about = about;
  if (typeof phone !== 'undefined') patch.phone = phone;
  if (typeof contrast !== 'undefined') patch.contrast = contrast;
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  await invalidate('profile', user.id);
  return data;
};
