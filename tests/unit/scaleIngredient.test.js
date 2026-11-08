import { scaleIngredient, formatAmount, MULTIPLIERS } from '../../lib/app/scaleIngredient';

describe('scaleIngredient', () => {
  test.each([
    ['1 1/2 cups flour', 2, '3 cups flour'],
    ['½ tsp salt', 2, '1 tsp salt'],
    ['1½ cups milk', 0.5, '¾ cups milk'],
    ['2-3 cloves garlic', 2, '4-6 cloves garlic'],
    ['2 to 3 apples', 0.5, '1 to 1½ apples'],
    ['2 (10 ounce) packages corn', 2, '4 (10 ounce) packages corn'],
    ['0.25 teaspoon pepper', 2, '½ teaspoon pepper'],
    ['1/3 cup sugar', 0.5, '⅙ cup sugar'],
    ['350g butter', 3, '1050g butter'],
    ['  4 cups water', 2, '  8 cups water'],
  ])('%s × %s → %s', (input, m, expected) => {
    expect(scaleIngredient(input, m)).toBe(expected);
  });

  test('lines without a leading amount are unchanged', () => {
    expect(scaleIngredient('Salt, to taste', 2)).toBe('Salt, to taste');
    expect(scaleIngredient('2 tomatoes', 1)).toBe('2 tomatoes');
  });

  test('formatAmount uses cooking fractions, else 2-place decimals', () => {
    expect(formatAmount(0.75)).toBe('¾');
    expect(formatAmount(2.5)).toBe('2½');
    expect(formatAmount(0.6)).toBe('0.6');
    expect(formatAmount(3)).toBe('3');
  });

  test('offers ½×, 1×, 2×, 3×', () => {
    expect(MULTIPLIERS.map((m) => m.value)).toEqual([0.5, 1, 2, 3]);
  });
});
