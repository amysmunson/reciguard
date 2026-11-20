import { sortRecipes, sortFolders, normalizeSort, compareText, DEFAULT_RECIPE_SORT } from '../../lib/app/sort';
import { applyDietaryVisibility, hidesUnsafeRecipes } from '../../lib/app/dietaryVisibility';
import { dotsForRecipe, ingredientAllergyInfo } from '../../lib/server/api/allergies';

const recipes = [
  { id: 'a', name: 'Banana bread', createdAt: '2026-01-01', ingredients: ['2 bananas', 'flour'] },
  { id: 'b', name: 'Apple pie', createdAt: '2026-03-01', ingredients: ['peanut butter', 'apples'] },
];
const peanut = [{ profileId: 'self', profileName: 'Me', name: 'peanut', severity: 'severe' }];

test('sortRecipes by name and date, both directions', () => {
  expect(sortRecipes(recipes, { by: 'name', dir: 'asc' }).map((r) => r.id)).toEqual(['b', 'a']);
  expect(sortRecipes(recipes, { by: 'created_at', dir: 'desc' }).map((r) => r.id)).toEqual(['b', 'a']);
  // Stale / corrupted saved values fall back; legacy bare strings still work.
  expect(normalizeSort('garbage', DEFAULT_RECIPE_SORT)).toEqual(DEFAULT_RECIPE_SORT);
  expect(normalizeSort({ by: 'nope', dir: 'asc' }, DEFAULT_RECIPE_SORT)).toEqual(DEFAULT_RECIPE_SORT);
  expect(normalizeSort('name', DEFAULT_RECIPE_SORT)).toEqual({ by: 'name', dir: 'desc' });
});

test('name sorts ignore case first, then use case only to break ties', () => {
  // Plain character order would put every capitalized name first: B, Z, a, c.
  const names = ['zucchini', 'Banana', 'apple', 'Zucchini', 'cherry', 'Apple'];
  expect([...names].sort(compareText)).toEqual(['Apple', 'apple', 'Banana', 'cherry', 'Zucchini', 'zucchini']);

  const mixed = ['banana bread', 'Apple pie', 'carrot cake', 'Brownies'].map((name, i) => ({ id: String(i), name, createdAt: '2026-01-01' }));
  expect(sortRecipes(mixed, { by: 'name', dir: 'asc' }).map((r) => r.name)).toEqual(['Apple pie', 'banana bread', 'Brownies', 'carrot cake']);
  expect(sortRecipes(mixed, { by: 'name', dir: 'desc' }).map((r) => r.name)).toEqual(['carrot cake', 'Brownies', 'banana bread', 'Apple pie']);

  // Untitled still sorts last, and leading spaces don't count.
  const folders = [{ name: 'dinner' }, { name: '' }, { name: '  Breakfast' }];
  expect(sortFolders(folders, { by: 'name', dir: 'asc' }).map((f) => f.name)).toEqual(['  Breakfast', 'dinner', '']);
});

test('hide-unsafe setting is read from the profile', () => {
  expect(hidesUnsafeRecipes({ hide_unsafe_recipes: true })).toBe(true);
  expect(hidesUnsafeRecipes({ hide_unsafe_recipes: false })).toBe(false);
  // Before the migration runs (no column) or before the profile loads.
  expect(hidesUnsafeRecipes({})).toBe(false);
  expect(hidesUnsafeRecipes(null)).toBe(false);
});

test('allergy matching flags the right ingredient and recipe', () => {
  expect(ingredientAllergyInfo('peanut butter', peanut)).toBeTruthy();
  expect(ingredientAllergyInfo('apples', peanut)).toBeFalsy();
  expect(dotsForRecipe(recipes[1], peanut)).toHaveLength(1);
  expect(dotsForRecipe(recipes[0], peanut)).toHaveLength(0);
});

test('hide-vs-warn: hides conflicting recipes only when on and a filter is active', () => {
  const on = applyDietaryVisibility(recipes, { hide: true, filterActive: true, activeAllergies: peanut });
  expect(on.visible.map((r) => r.id)).toEqual(['a']);
  expect(on.hiddenCount).toBe(1);
  expect(applyDietaryVisibility(recipes, { hide: false, filterActive: true, activeAllergies: peanut }).hiddenCount).toBe(0);
  expect(applyDietaryVisibility(recipes, { hide: true, filterActive: false, activeAllergies: peanut }).hiddenCount).toBe(0);
});
