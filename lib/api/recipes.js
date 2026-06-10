import { supabase } from '../supabase';
import { invalidate } from '../cache';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

const bustRecipeCaches = async () => {
  const { data } = await supabase.auth.getUser();
  invalidate('recipes', data?.user?.id);
};

const shapeRecipe = (row) => ({
  id: row.id,
  name: row.name ?? '',
  photo: row.photo ?? null,
  source: row.source ?? null,
  extLink: row.ext_link ?? null,
  isPublic: row.is_public ?? false,
  authorNotes: row.author_notes ?? [],
  userNotes: row.user_notes ?? [],
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

export const getRecipes = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*), recipe_steps(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(shapeRecipe);
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
      author_notes: recipe.authorNotes ?? [],
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
  if (recipe.authorNotes !== undefined) patch.author_notes = recipe.authorNotes;
  if (recipe.userNotes !== undefined) patch.user_notes = recipe.userNotes;

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

  await bustRecipeCaches();
  return getRecipe(recipeId);
};

export const deleteRecipe = async (recipeId) => {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  if (error) throw error;
  await bustRecipeCaches();
};

export const deleteRecipes = async (recipeIds) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase.from('recipes').delete().in('id', recipeIds);
  if (error) throw error;
  await bustRecipeCaches();
};
