import { toItem, normalizeItems, itemTexts, normalizeRecipe } from '../../lib/recipeItems';

test('strings and items normalize to { text, isHeader }', () => {
  expect(toItem('salt')).toEqual({ text: 'salt', isHeader: false });
  expect(toItem({ text: 'For the sauce', isHeader: true })).toEqual({ text: 'For the sauce', isHeader: true });
  expect(normalizeItems(null)).toEqual([]);
});

test('itemTexts drops section headers (they are not ingredients)', () => {
  expect(itemTexts(['egg', { text: 'Sauce', isHeader: true }, 'soy'])).toEqual(['egg', 'soy']);
});

test('normalizeRecipe fills defaults for older cached copies', () => {
  const r = normalizeRecipe({ id: 'r1', name: 'Old', ingredients: ['a'], steps: ['b'] });
  expect(r).toMatchObject({
    servings: null,
    prepMinutes: null,
    cookMinutes: null,
    totalMinutes: null,
    isFavorite: false,
    deletedAt: null,
    userNotes: [],
  });
  expect(r.ingredients).toEqual([{ text: 'a', isHeader: false }]);
  expect(normalizeRecipe(null)).toBeNull();
});
