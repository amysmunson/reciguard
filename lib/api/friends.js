import { supabase } from '../supabase';
import { invalidate } from '../cache';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const bustFriendCaches = async () => {
  const { data } = await supabase.auth.getUser();
  invalidate('friends', data?.user?.id);
};

// Rows from the get_my_friends() RPC, which returns each friendship plus only
// the linked user's PUBLIC profile fields (name, about) — never their private
// notes or contact details. linked_exists is false when not linked, or when the
// linked user has deleted their account.
const shapeFriend = (row) => ({
  id: row.id,
  existingFriendId: row.existing_friend_id ?? null,
  friendName: row.friend_name ?? null,
  friendNotes: row.friend_notes ?? null,
  linkedProfile: row.linked_exists
    ? { id: row.existing_friend_id, name: row.linked_name ?? null, about: row.linked_about ?? null }
    : null,
  createdAt: row.created_at,
});

// Display name: prefer the live linked profile name; fall back to the
// snapshot we took at link-time (friend_name); finally fall back to a label.
export const friendDisplayName = (friend) =>
  friend?.linkedProfile?.name || friend?.friendName || 'Unnamed';

export const getFriends = async () => {
  const { data, error } = await supabase.rpc('get_my_friends', { p_friendship_id: null });
  if (error) throw error;
  return (data ?? []).map(shapeFriend);
};

export const getFriend = async (friendshipId) => {
  const { data, error } = await supabase.rpc('get_my_friends', { p_friendship_id: friendshipId });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) throw new Error('Friend not found');
  return shapeFriend(row);
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
    .select('id')
    .single();
  if (error) throw error;
  await bustFriendCaches();
  return getFriend(data.id);
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
    .select('id')
    .single();
  if (error) throw error;
  await bustFriendCaches();
  return getFriend(data.id);
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

  const { error } = await supabase
    .from('friendships')
    .update({
      existing_friend_id: profile.id,
      friend_name: profile.name ?? null,
    })
    .eq('id', friendshipId);
  if (error) throw error;
  await bustFriendCaches();
  return getFriend(friendshipId);
};

// Break the link. Keep the snapshotted friend_name so the row still has a label.
export const unlinkFriend = async (friendshipId) => {
  const { error } = await supabase
    .from('friendships')
    .update({ existing_friend_id: null })
    .eq('id', friendshipId);
  if (error) throw error;
  await bustFriendCaches();
  return getFriend(friendshipId);
};

export const updateFriend = async (friendshipId, { friendName, friendNotes }) => {
  const { error } = await supabase
    .from('friendships')
    .update({ friend_name: friendName, friend_notes: friendNotes })
    .eq('id', friendshipId);
  if (error) throw error;
  await bustFriendCaches();
  return getFriend(friendshipId);
};

export const deleteFriend = async (friendshipId) => {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
  await bustFriendCaches();
};
