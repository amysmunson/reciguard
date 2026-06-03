import { supabase } from '../supabase';
import { invalidate } from '../cache';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const bustFolderCaches = async () => {
  const { data } = await supabase.auth.getUser();
  invalidate('folders', data?.user?.id);
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
  await bustFolderCaches();
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
  await bustFolderCaches();
  return data;
};

export const deleteFolder = async (folderId) => {
  const { error } = await supabase.from('folders').delete().eq('id', folderId);
  if (error) throw error;
  await bustFolderCaches();
};

export const getRecipesInFolder = async (folderId) => {
  const { data, error } = await supabase
    .from('recipe_folder_mapping')
    .select('recipe, recipes:recipe(*, recipe_ingredients(*))')
    .eq('folder', folderId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.recipes)
    .filter(Boolean)
    .map((r) => ({
      id: r.id,
      name: r.name ?? '',
      photo: r.photo ?? null,
      ingredients: (r.recipe_ingredients ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((i) => i.text),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
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

export const addRecipesToFolder = async ({ recipeIds, folderId }) => {
  if (!recipeIds?.length) return;
  const user = await requireUser();
  const rows = recipeIds.map((id) => ({ recipe: id, folder: folderId, user_id: user.id }));
  const { error } = await supabase.from('recipe_folder_mapping').upsert(rows, {
    onConflict: 'recipe,folder',
    ignoreDuplicates: true,
  });
  if (error) throw error;
};

export const removeRecipesFromFolder = async ({ recipeIds, folderId }) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase
    .from('recipe_folder_mapping')
    .delete()
    .eq('folder', folderId)
    .in('recipe', recipeIds);
  if (error) throw error;
};
