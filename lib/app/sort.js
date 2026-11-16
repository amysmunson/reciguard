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

const VALID_SORT_FIELDS = new Set(
  [...RECIPE_SORT_OPTIONS, ...FOLDER_SORT_OPTIONS].map((o) => o.id)
);

// Accepts whatever was read from storage (a legacy bare string like
// 'created_at', a { by, dir } object, or junk) and returns a valid sort.
export const normalizeSort = (saved, fallback) => {
  // Only sort fields the app actually offers; anything else (a stale or
  // corrupted saved value) falls back.
  const known = (by) => VALID_SORT_FIELDS.has(by);
  if (typeof saved === 'string' && known(saved)) return { by: saved, dir: 'desc' };
  if (saved && typeof saved === 'object' && known(saved.by)) {
    return { by: saved.by, dir: saved.dir === 'asc' ? 'asc' : 'desc' };
  }
  return fallback;
};

// Text order used for every name sort in the app: case-insensitive first
// ("apple" and "Banana" sort a, b), then plain character order to break
// ties between names that differ only by case ("Apple" before "apple").
// Done by hand instead of localeCompare, whose result depends on the
// engine's Intl support (Hermes can fall back to raw character codes, which
// puts every capitalized name before every lowercase one).
export const compareText = (a, b) => {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al !== bl) return al < bl ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

const nameKey = (name) => {
  const k = (name ?? '').trim();
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

// Compares two precomputed keys. `isName` uses compareText (case-insensitive,
// then case as the tie-breaker); ISO date strings sort lexicographically.
// nulls always last.
const compareKeys = (av, bv, isName, dir) => {
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  const cmp = isName ? compareText(av, bv) : av < bv ? -1 : av > bv ? 1 : 0;
  return dir === 'asc' ? cmp : -cmp;
};

export const sortRecipes = (recipes, { by, dir }, openedMap = {}) =>
  [...recipes].sort((a, b) =>
    compareKeys(recipeKey(a, by, openedMap), recipeKey(b, by, openedMap), by === 'name', dir)
  );

export const sortFolders = (folders, { by, dir }) =>
  [...folders].sort((a, b) => compareKeys(folderKey(a, by), folderKey(b, by), by === 'name', dir));
