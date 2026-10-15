import { supabase } from '../supabase';
import { invalidate } from '../cache';
import { refreshCachedRecipe, removeCachedRecipes } from '../recipeCache';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

// Busts the Home list cache. Returns the user id so callers can also update
// the per-recipe cache (lib/recipeCache.js).
const bustRecipeCaches = async () => {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  invalidate('recipes', userId);
  return userId;
};

const shapeRecipe = (row) => ({
  id: row.id,
  name: row.name ?? '',
  photo: row.photo ?? null,
  source: row.source ?? null,
  extLink: row.ext_link ?? null,
  isPublic: row.is_public ?? false,
  servings: row.servings ?? null,
  // author_notes is a legacy column (never auto-populated). Anything a user
  // typed there is folded into the single "Your Notes" list, and cleared from
  // author_notes the next time the recipe's notes are saved.
  userNotes: [...(row.author_notes ?? []), ...(row.user_notes ?? [])],
  ingredients: (row.recipe_ingredients ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.text),
  steps: (row.recipe_steps ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => s.text),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// List view for Home / FolderDetail's picker — and what Home caches on disk —
// so it carries only what tiles, search, sort, and allergy dots need: no
// steps, notes, links, or servings. Full recipes come from getRecipe.
export const getRecipes = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, photo, created_at, updated_at, recipe_ingredients(text, position)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    photo: row.photo ?? null,
    ingredients: (row.recipe_ingredients ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => i.text),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const getRecipe = async (recipeId) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_steps(*)')
    .eq('id', recipeId)
    .single();
  if (error) throw error;
  return shapeRecipe(data);
};

export const createRecipe = async (recipe = {}) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name: recipe.name ?? '',
      photo: recipe.photo ?? null,
      source: recipe.source ?? null,
      ext_link: recipe.extLink ?? null,
      is_public: recipe.isPublic ?? false,
      servings: recipe.servings ?? null,
      author_notes: [],
      user_notes: recipe.userNotes ?? [],
    })
    .select()
    .single();
  if (error) throw error;

  if (recipe.ingredients?.length) {
    await replaceChildRows('recipe_ingredients', data.id, recipe.ingredients);
  }
  if (recipe.steps?.length) {
    await replaceChildRows('recipe_steps', data.id, recipe.steps);
  }

  await bustRecipeCaches();
  return getRecipe(data.id);
};

const replaceChildRows = async (table, recipeId, texts) => {
  const { error: delError } = await supabase
    .from(table)
    .delete()
    .eq('recipe_id', recipeId);
  if (delError) throw delError;

  if (!texts.length) return;
  const rows = texts.map((text, position) => ({ recipe_id: recipeId, position, text }));
  const { error: insError } = await supabase.from(table).insert(rows);
  if (insError) throw insError;
};

export const updateRecipe = async (recipeId, recipe) => {
  // Patch only the columns the caller actually provided. EditRecipe doesn't
  // manage the external link / source / photo / visibility, so it omits them;
  // writing defaults here would silently wipe those fields on every save.
  const patch = { updated_at: new Date().toISOString() };
  if (recipe.name !== undefined) patch.name = recipe.name;
  if (recipe.photo !== undefined) patch.photo = recipe.photo;
  if (recipe.source !== undefined) patch.source = recipe.source;
  if (recipe.extLink !== undefined) patch.ext_link = recipe.extLink;
  if (recipe.isPublic !== undefined) patch.is_public = recipe.isPublic;
  if (recipe.servings !== undefined) patch.servings = recipe.servings;
  if (recipe.userNotes !== undefined) {
    // userNotes already includes any legacy author_notes (see shapeRecipe),
    // so clear that column to avoid showing them twice.
    patch.user_notes = recipe.userNotes;
    patch.author_notes = [];
  }

  const { error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', recipeId);
  if (error) throw error;

  // Likewise, only replace child rows when the caller passed them.
  if (recipe.ingredients !== undefined) {
    await replaceChildRows('recipe_ingredients', recipeId, recipe.ingredients ?? []);
  }
  if (recipe.steps !== undefined) {
    await replaceChildRows('recipe_steps', recipeId, recipe.steps ?? []);
  }

  const userId = await bustRecipeCaches();
  const updated = await getRecipe(recipeId);
  await refreshCachedRecipe(userId, updated);
  return updated;
};

export const deleteRecipe = async (recipeId) => {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  if (error) throw error;
  const userId = await bustRecipeCaches();
  await removeCachedRecipes(userId, [recipeId]);
};

export const deleteRecipes = async (recipeIds) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase.from('recipes').delete().in('id', recipeIds);
  if (error) throw error;
  const userId = await bustRecipeCaches();
  await removeCachedRecipes(userId, recipeIds);
};
