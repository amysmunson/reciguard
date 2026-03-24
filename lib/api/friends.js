import { supabase } from '../supabase';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const shapeFriend = (row) => ({
  id: row.id,
  existingFriendId: row.existing_friend_id ?? null,
  friendName: row.friend_name ?? null,
  friendNotes: row.friend_notes ?? null,
  linkedProfile: row.linked_profile ?? null,
  createdAt: row.created_at,
});

export const getFriends = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('friendships')
    .select('*, linked_profile:existing_friend_id(id, name, email)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(shapeFriend);
};

export const getFriend = async (friendshipId) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, linked_profile:existing_friend_id(id, name, email, notes)')
    .eq('id', friendshipId)
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

// Look up another user by their friend code. Returns { id, name } or null.
// Calls a SECURITY DEFINER RPC so the lookup is allowed even though
// non-friend profiles are otherwise unreadable.
export const lookupProfileByFriendCode = async (code) => {
  const normalized = (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) return null;
  const { data, error } = await supabase.rpc('lookup_friend_code', { p_code: normalized });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
};

// Add a manually-entered (off-platform) friend.
export const addFriend = async ({ friendName, friendNotes = null }) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_name: friendName,
      friend_notes: friendNotes,
      existing_friend_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

// Add a friend by entering their friend code. Resolves the code to a real
// profile and snapshots the name into the friendship row so the label
// survives if the friend later deletes their account.
export const addFriendByCode = async (code) => {
  const user = await requireUser();
  const profile = await lookupProfileByFriendCode(code);
  if (!profile) throw new Error('No user found for that code');
  if (profile.id === user.id) throw new Error("That's your own code");

  // Don't allow duplicate links to the same person
  const { data: existing, error: dupError } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('existing_friend_id', profile.id)
    .maybeSingle();
  if (dupError) throw dupError;
  if (existing) throw new Error('You already have this person as a friend');

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      existing_friend_id: profile.id,
      friend_name: profile.name ?? null,
      friend_notes: null,
    })
    .select('*, linked_profile:existing_friend_id(id, name, email, notes)')
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

// Link an existing (manually-added) friendship to a real account.
// Snapshots the profile name into friend_name so the row survives deletion.
export const linkFriendByCode = async ({ friendshipId, code }) => {
  const user = await requireUser();
  const profile = await lookupProfileByFriendCode(code);
  if (!profile) throw new Error('No user found for that code');
  if (profile.id === user.id) throw new Error("That's your own code");

  // Don't allow the same person on two friendships
  const { data: existing, error: dupError } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('existing_friend_id', profile.id)
    .neq('id', friendshipId)
    .maybeSingle();
  if (dupError) throw dupError;
  if (existing) throw new Error('You already have this person as another friend');

  const { data, error } = await supabase
    .from('friendships')
    .update({
      existing_friend_id: profile.id,
      friend_name: profile.name ?? null,
    })
    .eq('id', friendshipId)
    .select('*, linked_profile:existing_friend_id(id, name, email, notes)')
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

// Break the link. Keep the snapshotted friend_name so the row still has a label.
export const unlinkFriend = async (friendshipId) => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ existing_friend_id: null })
    .eq('id', friendshipId)
    .select()
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

export const updateFriend = async (friendshipId, { friendName, friendNotes }) => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ friend_name: friendName, friend_notes: friendNotes })
    .eq('id', friendshipId)
    .select('*, linked_profile:existing_friend_id(id, name, email, notes)')
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

export const deleteFriend = async (friendshipId) => {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
};
