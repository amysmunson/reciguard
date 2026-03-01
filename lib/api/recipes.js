import { supabase } from '../supabase';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
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
  const { error } = await supabase
    .from('recipes')
    .update({
      name: recipe.name,
      photo: recipe.photo ?? null,
      source: recipe.source ?? null,
      ext_link: recipe.extLink ?? null,
      is_public: recipe.isPublic ?? false,
      author_notes: recipe.authorNotes ?? [],
      user_notes: recipe.userNotes ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', recipeId);
  if (error) throw error;

  await replaceChildRows('recipe_ingredients', recipeId, recipe.ingredients ?? []);
  await replaceChildRows('recipe_steps', recipeId, recipe.steps ?? []);

  return getRecipe(recipeId);
};

export const deleteRecipe = async (recipeId) => {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  if (error) throw error;
};

export const deleteRecipes = async (recipeIds) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase.from('recipes').delete().in('id', recipeIds);
  if (error) throw error;
};
