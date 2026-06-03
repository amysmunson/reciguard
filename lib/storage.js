import AsyncStorage from '@react-native-async-storage/async-storage';

export const loadJson = async (key, fallback = null) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const saveJson = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // swallow — persistence is best-effort
  }
};

export const removeKey = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // swallow
  }
};

// Centralized key names so we don't typo them across the app.
// Per-user state is namespaced by user id so settings don't leak between
// users who share a device (sign out → sign in as someone else).
export const KEYS = {
  homeAllergyFilter: (userId) => `home.allergyFilter:${userId}`,
  homeSort: (userId) => `home.sort:${userId}`,
  // Sort for the folders grid, and for recipes shown inside any folder.
  foldersSort: (userId) => `folders.sort:${userId}`,
  folderRecipesSort: (userId) => `folder.recipesSort:${userId}`,
  // Map of { [recipeId]: ISO timestamp } — last-opened time per recipe.
  recipeOpenedAt: (userId) => `recipe.openedAt:${userId}`,
};

// Helpers for the recipe-opens map (used by RecipeCard and Home's sort).
export const recordRecipeOpened = async (userId, recipeId) => {
  if (!userId || !recipeId) return;
  const key = KEYS.recipeOpenedAt(userId);
  const map = (await loadJson(key, {})) ?? {};
  map[recipeId] = new Date().toISOString();
  await saveJson(key, map);
};

export const getRecipeOpenedMap = async (userId) => {
  if (!userId) return {};
  return (await loadJson(KEYS.recipeOpenedAt(userId), {})) ?? {};
};
