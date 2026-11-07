import { sortRecipes, normalizeSort, DEFAULT_RECIPE_SORT } from '../../lib/sort';
import { applyDietaryVisibility } from '../../lib/useHideUnsafe';
import { dotsForRecipe, ingredientAllergyInfo } from '../../lib/api/allergies';

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
