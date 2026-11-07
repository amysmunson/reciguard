import { loadJson, removeKey, getRecipeOpenedMap, forgetRecipesOpened } from './storage';
import { loadCached, saveCached } from './cachePreference';

// Full-recipe cache for the user's most recently opened recipes, so they open
// instantly and stay readable offline. Each recipe is its own AsyncStorage
// entry (no single blob that grows with the library); an index key lists
// which ids are stored so eviction and sign-out cleanup don't need to scan
// every key. Which recipes stay is decided by the last-opened map in
// lib/storage.js — the same one behind Home's "Recently opened" sort.
// Reads/writes go through lib/cachePreference.js, so nothing is cached when
// Settings → "Keep copies on this device" is off.

export const RECENT_RECIPE_LIMIT = 5;

const recipeKey = (userId, recipeId) => `cache:recipe:${userId}:${recipeId}`;
const indexKey = (userId) => `cache:recipeIndex:${userId}`;

// Index updates are read-modify-write; run them one at a time so opening two
// recipes in quick succession can't drop an id from the index.
let queue = Promise.resolve();
const serialize = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
};

const loadIndex = async (userId) => (await loadCached(indexKey(userId), [])) ?? [];
// Cleanup (delete / sign-out / turning caching off) must find what's stored
// even while caching is off — loadCached would return [] then and leave the
// cached recipes on the device. So deletions read the index directly.
const loadIndexForCleanup = async (userId) => (await loadJson(indexKey(userId), [])) ?? [];

export const getCachedRecipe = async (userId, recipeId) => {
  if (!userId || !recipeId) return null;
  return loadCached(recipeKey(userId, recipeId), null);
};

// Stores a freshly fetched recipe, then evicts anything that has fallen out
// of the RECENT_RECIPE_LIMIT most recently opened. Call after
// recordRecipeOpened so the recipe being stored counts as the newest.
export const cacheRecentRecipe = (userId, recipe) =>
  serialize(async () => {
    if (!userId || !recipe?.id) return;
    const openedMap = await getRecipeOpenedMap(userId);
    const keep = new Set(
      Object.entries(openedMap)
        .sort(([, a], [, b]) => (a < b ? 1 : a > b ? -1 : 0))
        .slice(0, RECENT_RECIPE_LIMIT)
        .map(([id]) => id)
    );
    if (!keep.has(recipe.id)) return;

    await saveCached(recipeKey(userId, recipe.id), recipe);
    const index = new Set(await loadIndex(userId));
    index.add(recipe.id);
    const evicted = [...index].filter((id) => !keep.has(id));
    await Promise.all(evicted.map((id) => removeKey(recipeKey(userId, id))));
    await saveCached(indexKey(userId), [...index].filter((id) => keep.has(id)));
  });

// Keeps a cached copy current after an edit. Recipes that aren't cached are
// left alone — editing doesn't count as opening.
export const refreshCachedRecipe = (userId, recipe) =>
  serialize(async () => {
    if (!userId || !recipe?.id) return;
    if (!(await loadIndex(userId)).includes(recipe.id)) return;
    await saveCached(recipeKey(userId, recipe.id), recipe);
  });

// Re-fetches every cached recipe in the background (app launch), so the
// copies are current before the user goes offline. `fetchRecipe` is
// lib/api/recipes.js's getRecipe, passed in to avoid a circular import.
// Recipes deleted elsewhere (no row found) are dropped; other failures
// (offline) leave the cached copy as is.
export const refreshAllCachedRecipes = async (userId, fetchRecipe) => {
  if (!userId) return;
  const ids = await loadIndex(userId);
  await Promise.all(
    ids.map(async (id) => {
      try {
        await refreshCachedRecipe(userId, await fetchRecipe(id));
      } catch (err) {
        if (err?.code === 'PGRST116') await removeCachedRecipes(userId, [id]);
      }
    })
  );
};

// Drops deleted recipes from the cache, and from the opens map so they don't
// keep holding "recently opened" slots.
export const removeCachedRecipes = (userId, recipeIds) =>
  serialize(async () => {
    if (!userId || !recipeIds?.length) return;
    await forgetRecipesOpened(userId, recipeIds);
    const gone = new Set(recipeIds);
    await Promise.all(recipeIds.map((id) => removeKey(recipeKey(userId, id))));
    const index = await loadIndexForCleanup(userId);
    await saveCached(indexKey(userId), index.filter((id) => !gone.has(id)));
  });

// Sign-out / account deletion: remove every cached recipe and the index.
export const clearCachedRecipes = (userId) =>
  serialize(async () => {
    if (!userId) return;
    const index = await loadIndexForCleanup(userId);
    await Promise.all(index.map((id) => removeKey(recipeKey(userId, id))));
    await removeKey(indexKey(userId));
  });
