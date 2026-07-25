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
  return (data ?? [])
    .map(shapeFriend)
    .sort((a, b) =>
      friendDisplayName(a).localeCompare(friendDisplayName(b), undefined, { sensitivity: 'base' })
    );
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
  if (await isBlocked(profile.id)) throw new Error("You can't add this person.");

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
  if (await isBlocked(profile.id)) throw new Error("You can't add this person.");

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

// Rows from get_sharing_with() — other users who have linked to the caller,
// i.e. who the caller is currently sharing their profile/allergies with.
// Distinct from getFriends(), which lists people *you* added; this is the
// reverse direction, which RLS alone can't answer since a user can't
// normally read other users' friendships rows.
const shapeSharingWith = (row) => ({
  friendshipId: row.friendship_id,
  sharerId: row.sharer_id,
  sharerName: row.sharer_name ?? 'Unnamed',
  linkedSince: row.linked_since,
});

export const getSharingWith = async () => {
  const { data, error } = await supabase.rpc('get_sharing_with');
  if (error) throw error;
  return (data ?? [])
    .map(shapeSharingWith)
    .sort((a, b) => a.sharerName.localeCompare(b.sharerName, undefined, { sensitivity: 'base' }));
};

// "Remove" — one-directionally stop this person from seeing your data. They
// can add you again later; this does not block them. Calls a SECURITY
// DEFINER RPC since the caller isn't the owner of the friendship row being
// modified (it's the other person's row, pointing at the caller).
export const revokeMyAccess = async (friendshipId) => {
  const { error } = await supabase.rpc('revoke_my_access', { p_friendship_id: friendshipId });
  if (error) throw error;
  await bustFriendCaches();
};

// "Block" — severs the link on both sides and permanently prevents either of
// you from adding/linking to each other again (enforced by a DB trigger on
// friendships, not just this client-side path).
export const blockUser = async (targetUserId) => {
  const { error } = await supabase.rpc('block_user', { p_target_user_id: targetUserId });
  if (error) throw error;
  await bustFriendCaches();
};

// Cheap pre-check so addFriendByCode/linkFriendByCode can show a clean error
// before attempting the insert/update — the real enforcement is the DB
// trigger, this is purely a nicer message.
export const isBlocked = async (targetUserId) => {
  const { data, error } = await supabase.rpc('is_blocked', { p_user_id: targetUserId });
  if (error) throw error;
  return !!data;
};

// Block someone directly by their friend code — no existing friendship or
// prior link required. block_user() only needs a target user id, so this
// just resolves the code the same way addFriendByCode does and blocks that
// person straight away, preempting ever sharing with them.
export const blockUserByCode = async (code) => {
  const user = await requireUser();
  const profile = await lookupProfileByFriendCode(code);
  if (!profile) throw new Error('No user found for that code');
  if (profile.id === user.id) throw new Error("That's your own code");
  await blockUser(profile.id);
  return profile;
};

// People the caller has blocked — for the "Blocked Users" screen. Resolving
// the blocked person's name needs a SECURITY DEFINER RPC since their
// profiles row usually isn't readable to the caller anymore (blocking is
// exactly what severs the friendship link that would otherwise permit it).
const shapeBlock = (row) => ({
  blockId: row.block_id,
  blockedId: row.blocked_id,
  blockedName: row.blocked_name ?? 'Unnamed',
  blockedSince: row.blocked_since,
});

export const getMyBlocks = async () => {
  const { data, error } = await supabase.rpc('get_my_blocks');
  if (error) throw error;
  return (data ?? [])
    .map(shapeBlock)
    .sort((a, b) => a.blockedName.localeCompare(b.blockedName, undefined, { sensitivity: 'base' }));
};

// Unblocking is a plain delete of the caller's own blocked_users row — no
// RPC needed, RLS (blocked_users_delete_own) already permits this directly.
export const unblockUser = async (targetUserId) => {
  const user = await requireUser();
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId);
  if (error) throw error;
  await bustFriendCaches();
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
