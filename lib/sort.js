// Shared sort logic for recipe and folder grids (Home, Folders, FolderDetail).
//
// A sort selection is { by, dir } where `by` is an option id and `dir` is
// 'asc' | 'desc'. Missing values always sort to the bottom regardless of
// direction, so a recipe that has never been opened doesn't jump to the top.

export const RECIPE_SORT_OPTIONS = [
  { id: 'created_at', label: 'Date added' },
  { id: 'updated_at', label: 'Last edited' },
  { id: 'opened_at', label: 'Recently opened' },
  { id: 'name', label: 'Alphabetical' },
];

export const FOLDER_SORT_OPTIONS = [
  { id: 'name', label: 'Alphabetical' },
  { id: 'created_at', label: 'Date added' },
];

export const DEFAULT_RECIPE_SORT = { by: 'created_at', dir: 'desc' };
export const DEFAULT_FOLDER_SORT = { by: 'created_at', dir: 'desc' };

// Accepts whatever was read from storage (a legacy bare string like
// 'created_at', a { by, dir } object, or junk) and returns a valid sort.
export const normalizeSort = (saved, fallback) => {
  if (typeof saved === 'string' && saved) return { by: saved, dir: 'desc' };
  if (saved && typeof saved === 'object' && saved.by) {
    return { by: saved.by, dir: saved.dir === 'asc' ? 'asc' : 'desc' };
  }
  return fallback;
};

const nameKey = (name) => {
  const k = (name ?? '').trim().toLowerCase();
  return k || null; // untitled items sort to the bottom
};

const recipeKey = (r, by, openedMap) => {
  if (by === 'name') return nameKey(r.name);
  if (by === 'opened_at') return openedMap?.[r.id] ?? null;
  if (by === 'updated_at') return r.updatedAt ?? r.createdAt ?? null;
  return r.createdAt ?? null; // created_at
};

const folderKey = (f, by) => {
  if (by === 'name') return nameKey(f.name);
  return f.created_at ?? null; // created_at (folders come straight from supabase)
};

// Compares two precomputed keys. `isName` switches to locale-aware string
// compare so accented characters order correctly; ISO date strings sort
// lexicographically. nulls always last.
const compareKeys = (av, bv, isName, dir) => {
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  const cmp = isName ? av.localeCompare(bv) : av < bv ? -1 : av > bv ? 1 : 0;
  return dir === 'asc' ? cmp : -cmp;
};

export const sortRecipes = (recipes, { by, dir }, openedMap = {}) =>
  [...recipes].sort((a, b) =>
    compareKeys(recipeKey(a, by, openedMap), recipeKey(b, by, openedMap), by === 'name', dir)
  );

export const sortFolders = (folders, { by, dir }) =>
  [...folders].sort((a, b) => compareKeys(folderKey(a, by), folderKey(b, by), by === 'name', dir));
