import { supabase } from '../supabase';
import { invalidate } from '../../app/cache';
import { loadJson, saveJson, KEYS } from '../../app/storage';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

// The signed-in user's id from the stored session: no network round trip,
// unlike getUser(). Row Level Security still makes sure only the user's own
// row can change.
const sessionUserId = async () => {
  const { data } = await supabase.auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error('Not signed in');
  return id;
};

// Profile fields that are Settings switches (see lib/server/useProfileToggle.js).
export const PROFILE_FLAGS = ['contrast', 'hide_unsafe_recipes'];

// Fast path for Settings switches: a single request with no response body,
// and no cache invalidation (the caller has already updated the cached
// profile, so nothing needs refetching).
export const setMyProfileFlags = async (flags) => {
  const patch = Object.fromEntries(
    Object.entries(flags).filter(([k, v]) => PROFILE_FLAGS.includes(k) && typeof v === 'boolean')
  );
  if (!Object.keys(patch).length) return;
  const id = await sessionUserId();
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
};

// Settings switches that can fall back to the device while their profile
// column doesn't exist yet (its migration in supabase/ hasn't been run).
const DEVICE_FALLBACK_KEYS = {
  hide_unsafe_recipes: KEYS.hideUnsafeRecipes,
};

// A missing column is filled in from the device and listed in `deviceOnly`,
// so screens read the setting as usual and toggles save it on the device.
// Once the column exists, the server row has it and this does nothing.
const withDeviceFallbacks = async (row, userId) => {
  if (!row) return row;
  const missing = Object.keys(DEVICE_FALLBACK_KEYS).filter((field) => !(field in row));
  if (!missing.length) return row;
  const out = { ...row, deviceOnly: missing };
  for (const field of missing) {
    out[field] = !!(await loadJson(DEVICE_FALLBACK_KEYS[field](userId), false));
  }
  return out;
};

export const isDeviceOnlyFlag = (profile, field) => !!profile?.deviceOnly?.includes(field);

export const saveDeviceFlag = (field, userId, value) =>
  saveJson(DEVICE_FALLBACK_KEYS[field](userId), value);

export const getMyProfile = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return withDeviceFallbacks(data, user.id);
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
