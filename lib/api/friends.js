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
  // linkedProfile is the joined public-facing profile when this friendship
  // is linked to a real platform user. Null when not linked OR when the
  // linked user has deleted their account (existing_friend_id is still set
  // but the join returns null).
  linkedProfile: row.linked_profile ?? null,
  createdAt: row.created_at,
});

// Display name: prefer the live linked profile name; fall back to the
// snapshot we took at link-time (friend_name); finally fall back to a label.
export const friendDisplayName = (friend) =>
  friend?.linkedProfile?.name || friend?.friendName || 'Unnamed';

export const getFriends = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('friendships')
    .select('*, linked_profile:existing_friend_id(id, name, email, notes)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(shapeFriend);
};

export const getFriend = async (friendshipId) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, linked_profile:existing_friend_id(id, name, email)')
    .eq('id', friendshipId)
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

export const addFriend = async ({ friendName, friendNotes = null, existingFriendId = null }) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_name: friendName,
      friend_notes: friendNotes,
      existing_friend_id: existingFriendId,
    })
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
    .select()
    .single();
  if (error) throw error;
  return shapeFriend(data);
};

export const deleteFriend = async (friendshipId) => {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
};
