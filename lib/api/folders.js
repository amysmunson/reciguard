import { supabase } from '../supabase';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

export const getFolders = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getFolder = async (folderId) => {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', folderId)
    .single();
  if (error) throw error;
  return data;
};

export const createFolder = async ({ name, photo = null }) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('folders')
    .insert({ user_id: user.id, name, photo })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateFolder = async (folderId, { name, photo }) => {
  const { data, error } = await supabase
    .from('folders')
    .update({ name, photo })
    .eq('id', folderId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteFolder = async (folderId) => {
  const { error } = await supabase.from('folders').delete().eq('id', folderId);
  if (error) throw error;
};

export const getRecipesInFolder = async (folderId) => {
  const { data, error } = await supabase
    .from('recipe_folder_mapping')
    .select('recipe, recipes:recipe(*)')
    .eq('folder', folderId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.recipes)
    .filter(Boolean)
    .map((r) => ({
      id: r.id,
      name: r.name ?? '',
      photo: r.photo ?? null,
    }));
};

export const addRecipeToFolder = async ({ recipeId, folderId }) => {
  const user = await requireUser();
  const { error } = await supabase
    .from('recipe_folder_mapping')
    .insert({ recipe: recipeId, folder: folderId, user_id: user.id });
  if (error) throw error;
};

export const removeRecipeFromFolder = async ({ recipeId, folderId }) => {
  const { error } = await supabase
    .from('recipe_folder_mapping')
    .delete()
    .eq('recipe', recipeId)
    .eq('folder', folderId);
  if (error) throw error;
};
