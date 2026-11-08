// Ingredient / step list items. A full recipe's `ingredients` and `steps`
// are arrays of { text, isHeader }: a header row ("For the sauce") starts a
// section, every other row is a normal ingredient/step. Header rows are
// stored like any other row, with recipe_ingredients/recipe_steps.is_header.
//
// List views (Home, folders) only carry ingredient TEXT for allergy dots, so
// they keep plain strings with headers left out — see getRecipes().

export const toItem = (x) =>
  typeof x === 'string'
    ? { text: x, isHeader: false }
    : { text: x?.text ?? '', isHeader: !!x?.isHeader };

// Accepts strings (older cached copies, sample data) or items.
export const normalizeItems = (list) => (list ?? []).map(toItem);

// Text of the non-header rows — what allergy matching and scaling use.
export const itemTexts = (list) =>
  normalizeItems(list)
    .filter((i) => !i.isHeader)
    .map((i) => i.text);

// Fills defaults for fields added after a copy was cached on the device, so
// screens can read any recipe — fresh, or from lib/app/recipeCache.js — the same way.
export const normalizeRecipe = (r) =>
  r && {
    prepMinutes: null,
    cookMinutes: null,
    totalMinutes: null,
    isFavorite: false,
    deletedAt: null,
    userNotes: [],
    servings: null,
    ...r,
    ingredients: normalizeItems(r.ingredients),
    steps: normalizeItems(r.steps),
  };
