import { supabase } from '../supabase';
import { invalidate } from '../../app/cache';
import { refreshCachedRecipe, removeCachedRecipes } from '../../app/recipeCache';
import { normalizeItems, normalizeRecipe } from '../../app/recipeItems';

const requireUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user;
};

// Busts the Home list cache. Returns the user id so callers can also update
// the per-recipe cache (lib/app/recipeCache.js).
const bustRecipeCaches = async () => {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  invalidate('recipes', userId);
  return userId;
};

// Rows from recipe_ingredients / recipe_steps, in order.
const sortedRows = (rows) => (rows ?? []).slice().sort((a, b) => a.position - b.position);

const shapeRecipe = (row) => ({
  id: row.id,
  name: row.name ?? '',
  photo: row.photo ?? null,
  source: row.source ?? null,
  extLink: row.ext_link ?? null,
  isPublic: row.is_public ?? false,
  isFavorite: row.is_favorite ?? false,
  deletedAt: row.deleted_at ?? null,
  // null = not filled in (the card hides it; scaling treats it as 1).
  servings: row.servings ?? null,
  prepMinutes: row.prep_minutes ?? null,
  cookMinutes: row.cook_minutes ?? null,
  totalMinutes: row.total_minutes ?? null,
  // author_notes is a legacy column (never auto-populated). Anything a user
  // typed there is folded into the single "Your Notes" list, and cleared from
  // author_notes the next time the recipe's notes are saved.
  userNotes: [...(row.author_notes ?? []), ...(row.user_notes ?? [])],
  // { text, isHeader } items — see lib/app/recipeItems.js.
  ingredients: sortedRows(row.recipe_ingredients).map((i) => ({
    text: i.text,
    isHeader: !!i.is_header,
  })),
  steps: sortedRows(row.recipe_steps).map((st) => ({
    text: st.text,
    isHeader: !!st.is_header,
  })),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// List views (Home, folders, Favorites, Trash) — and what Home caches on
// disk — carry only what tiles, search, sort, and allergy dots need: no
// steps, notes, links, servings, or times. Ingredients are plain strings with
// section headers left out (headers aren't ingredients, so they mustn't
// trigger allergy dots).
export const RECIPE_SUMMARY_SELECT =
  'id, name, photo, is_favorite, deleted_at, created_at, updated_at, recipe_ingredients(text, position, is_header)';

export const shapeRecipeSummary = (row) => ({
  id: row.id,
  name: row.name ?? '',
  photo: row.photo ?? null,
  isFavorite: row.is_favorite ?? false,
  ingredients: sortedRows(row.recipe_ingredients)
    .filter((i) => !i.is_header)
    .map((i) => i.text),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
});

// Every recipe not in Trash.
export const getRecipes = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SUMMARY_SELECT)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(shapeRecipeSummary);
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

// Accepts items or plain strings (link import, older callers). Blank rows are
// dropped; header rows keep their flag.
const toRows = (recipeId, list) =>
  normalizeItems(list)
    .map((i) => ({ ...i, text: i.text.trim() }))
    .filter((i) => i.text.length > 0)
    .map((i, position) => ({ recipe_id: recipeId, position, text: i.text, is_header: i.isHeader }));

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
      is_favorite: recipe.isFavorite ?? false,
      servings: recipe.servings ?? null,
      prep_minutes: recipe.prepMinutes ?? null,
      cook_minutes: recipe.cookMinutes ?? null,
      total_minutes: recipe.totalMinutes ?? null,
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

const replaceChildRows = async (table, recipeId, list) => {
  const { error: delError } = await supabase
    .from(table)
    .delete()
    .eq('recipe_id', recipeId);
  if (delError) throw delError;

  const rows = toRows(recipeId, list);
  if (!rows.length) return;
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
  if (recipe.prepMinutes !== undefined) patch.prep_minutes = recipe.prepMinutes;
  if (recipe.cookMinutes !== undefined) patch.cook_minutes = recipe.cookMinutes;
  if (recipe.totalMinutes !== undefined) patch.total_minutes = recipe.totalMinutes;
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

// --- Favorites --------------------------------------------------------------

// Star / unstar. Doesn't touch updated_at, so favoriting doesn't count as an
// edit for the "Last edited" sort.
export const setRecipesFavorite = async (recipeIds, isFavorite) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase
    .from('recipes')
    .update({ is_favorite: isFavorite })
    .in('id', recipeIds);
  if (error) throw error;
  const userId = await bustRecipeCaches();
  await Promise.all(
    recipeIds.map(async (id) => {
      try {
        await refreshCachedRecipe(userId, await getRecipe(id));
      } catch {
        // cached copy refreshes on next open
      }
    })
  );
};

export const setRecipeFavorite = (recipeId, isFavorite) =>
  setRecipesFavorite([recipeId], isFavorite);

// --- Copy -------------------------------------------------------------------

// Creates a new recipe from `source` — a full recipe, or EditRecipe's
// on-screen (possibly unsaved) values. Copies everything except the id,
// favorite flag, and folder memberships; the name gets a " (copy)" suffix.
export const duplicateRecipe = async (source) => {
  const r = normalizeRecipe(source);
  const name = (r.name ?? '').trim();
  return createRecipe({
    name: name ? `${name} (copy)` : 'Untitled (copy)',
    photo: r.photo ?? null,
    source: r.source ?? null,
    extLink: r.extLink ?? null,
    servings: r.servings,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    totalMinutes: r.totalMinutes,
    ingredients: r.ingredients,
    steps: r.steps,
    userNotes: r.userNotes,
  });
};

// --- Trash ------------------------------------------------------------------

// Trashed recipes are kept this long, then deleted for good.
export const TRASH_RETENTION_DAYS = 30;

// When a trashed recipe will be purged.
export const trashPurgeDate = (deletedAt) =>
  new Date(new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * 86400000);

// "Delete" in the app: moves recipes to Trash (soft delete). They disappear
// from Home, folders, and Favorites but can be restored for 30 days.
export const trashRecipes = async (recipeIds) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase
    .from('recipes')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', recipeIds);
  if (error) throw error;
  const userId = await bustRecipeCaches();
  await removeCachedRecipes(userId, recipeIds);
};

export const trashRecipe = (recipeId) => trashRecipes([recipeId]);

export const restoreRecipes = async (recipeIds) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase
    .from('recipes')
    .update({ deleted_at: null })
    .in('id', recipeIds);
  if (error) throw error;
  await bustRecipeCaches();
};

// Permanent delete — only offered from Trash.
export const deleteRecipesForever = async (recipeIds) => {
  if (!recipeIds?.length) return;
  const { error } = await supabase.from('recipes').delete().in('id', recipeIds);
  if (error) throw error;
  const userId = await bustRecipeCaches();
  await removeCachedRecipes(userId, recipeIds);
};

// Deletes everything trashed more than TRASH_RETENTION_DAYS ago.
const purgeExpiredTrash = async (userId) => {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 86400000).toISOString();
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('user_id', userId)
    .lt('deleted_at', cutoff);
  if (error) throw error;
};

// Trash folder contents, newest first. Purges expired items first.
export const getTrashedRecipes = async () => {
  const user = await requireUser();
  await purgeExpiredTrash(user.id);
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SUMMARY_SELECT)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) throw error;
  return data.map(shapeRecipeSummary);
};

export const emptyTrash = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('recipes')
    .delete()
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .select('id');
  if (error) throw error;
  const userId = await bustRecipeCaches();
  await removeCachedRecipes(userId, (data ?? []).map((r) => r.id));
};
