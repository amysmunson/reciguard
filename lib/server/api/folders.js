import { supabase } from '../supabase';
import { invalidate } from '../../app/cache';
import { RECIPE_SUMMARY_SELECT, shapeRecipeSummary } from './recipes';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const bustFolderCaches = async () => {
  const { data } = await supabase.auth.getUser();
  invalidate('folders', data?.user?.id);
  invalidate('folderMembers', data?.user?.id);
};

// Which recipes are in which folders, as { [folderId]: [recipeId, ...] } —
// ids only, so it stays tiny. Cached as the 'folderMembers' resource so
// FolderDetail can paint from cache (joined with Home's cached recipe list)
// before its own server load lands.
export const getFolderMemberships = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('recipe_folder_mapping')
    .select('recipe, folder')
    .eq('user_id', user.id);
  if (error) throw error;
  const map = {};
  for (const row of data ?? []) (map[row.folder] ??= []).push(row.recipe);
  return map;
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

export const deleteFolders = async (folderIds) => {
  if (!folderIds?.length) return;
  const { error } = await supabase.from('folders').delete().in('id', folderIds);
  if (error) throw error;
  await bustFolderCaches();
};

// Recipes in a folder, in the same summary shape as getRecipes(). Recipes in
// Trash keep their folder rows (so Restore puts them back) but aren't shown.
export const getRecipesInFolder = async (folderId) => {
  const { data, error } = await supabase
    .from('recipe_folder_mapping')
    .select(`recipe, recipes:recipe(${RECIPE_SUMMARY_SELECT})`)
    .eq('folder', folderId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.recipes)
    .filter((r) => r && !r.deleted_at)
    .map(shapeRecipeSummary);
};

export const addRecipeToFolder = async ({ recipeId, folderId }) => {
  const user = await requireUser();
  const { error } = await supabase
    .from('recipe_folder_mapping')
    .insert({ recipe: recipeId, folder: folderId, user_id: user.id });
  if (error) throw error;
  await bustFolderCaches();
};

export const removeRecipeFromFolder = async ({ recipeId, folderId }) => {
  const { error } = await supabase
    .from('recipe_folder_mapping')
    .delete()
    .eq('recipe', recipeId)
    .eq('folder', folderId);
  if (error) throw error;
  await bustFolderCaches();
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
  await bustFolderCaches();
};

export const removeRecipesFromFolder = async ({ recipeIds, folderId }) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase
    .from('recipe_folder_mapping')
    .delete()
    .eq('folder', folderId)
    .in('recipe', recipeIds);
  if (error) throw error;
  await bustFolderCaches();
};
