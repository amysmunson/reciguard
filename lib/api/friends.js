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
