import { supabase } from '../supabase';
import { colors } from '../../styles/theme';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const shapeAllergy = (row) => ({
  id: row.id,
  name: row.name,
  severity: row.severity,
  userCustom: row.user_custom ?? false,
  friendId: row.friend_id ?? null,
  createdAt: row.created_at,
});

export const getMyAllergies = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .eq('user_id', user.id)
    .is('friend_id', null);
  if (error) throw error;
  return (data ?? []).map(shapeAllergy);
};

export const getFriendAllergies = async (friendId) => {
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .eq('friend_id', friendId);
  if (error) throw error;
  return (data ?? []).map(shapeAllergy);
};

export const getLinkedUserAllergies = async (linkedUserId) => {
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .eq('user_id', linkedUserId)
    .is('friend_id', null);
  if (error) throw error;
  return (data ?? []).map(shapeAllergy);
};

export const addAllergy = async ({ name, severity = null, userCustom = true, friendId = null }) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('allergies')
    .insert({
      user_id: user.id,
      name,
      severity,
      user_custom: userCustom,
      friend_id: friendId,
    })
    .select()
    .single();
  if (error) throw error;
  return shapeAllergy(data);
};

export const deleteAllergy = async (allergyId) => {
  const { error } = await supabase.from('allergies').delete().eq('id', allergyId);
  if (error) throw error;
};
