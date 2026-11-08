import { fetchRecipeFromUrl } from '../../lib/server/recipeUrlParser';

const ld = {
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Chicken &amp; Rice',
  recipeYield: ['4', '4 servings'],
  prepTime: 'PT15M',
  cookTime: 'PT1H',
  recipeIngredient: ['1 lb chicken', '1 cup rice', '2 tbsp soy sauce', '1 tsp honey'],
  recipeInstructions: [
    { '@type': 'HowToSection', name: 'Chicken', itemListElement: [{ '@type': 'HowToStep', text: 'Season.' }] },
    { '@type': 'HowToSection', name: 'Sauce', itemListElement: [{ '@type': 'HowToStep', text: 'Whisk.' }] },
  ],
};
const page = (body = '', recipe = ld) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(recipe)}</script></head><body>${body}</body></html>`;
const li = (t) => `<li class="wprm-recipe-ingredient">${t}</li>`;
// WP Recipe Maker card whose title holds a US/Metric toggle (natashaskitchen.com style).
const wprm = `<div class="wprm-recipe-ingredients-container"><h3 class="wprm-recipe-header"><span>Ingredients</span><div class="wprm-unit-conversion-container"><button class="wprm-unit-conversion">US Customary</button><button class="wprm-unit-conversion">Metric</button></div></h3>
  <ul>${li('a')}${li('b')}</ul><h4 class="wprm-recipe-group-name">For the sauce</h4><ul>${li('c')}${li('d')}</ul></div>
  <div class="wprm-recipe-instructions-container"></div>`;

const serve = (html, init = {}) => {
  global.fetch = jest.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: { get: () => init.contentLength ?? null },
    text: async () => html,
  }));
};

test('parses name, servings, times, and step sections', async () => {
  serve(page());
  const r = await fetchRecipeFromUrl('https://example.com/r');
  expect(r.name).toBe('Chicken & Rice');
  expect(r).toMatchObject({ servings: 4, prepMinutes: 15, cookMinutes: 60, totalMinutes: 75 });
  expect(r.steps.filter((s) => s.isHeader).map((s) => s.text)).toEqual(['Chicken', 'Sauce']);
  expect(r.source).toBe('example.com');
});

test('reads ingredient sections from a WPRM card and ignores its unit toggle title', async () => {
  serve(page(wprm));
  const r = await fetchRecipeFromUrl('https://example.com/r');
  expect(r.ingredients.map((i) => (i.isHeader ? `## ${i.text}` : i.text))).toEqual([
    '1 lb chicken',
    '1 cup rice',
    '## For the sauce',
    '2 tbsp soy sauce',
    '1 tsp honey',
  ]);
});

test('no sections when the plugin list count does not match', async () => {
  serve(page(wprm.replace(li('d'), '')));
  const r = await fetchRecipeFromUrl('https://example.com/r');
  expect(r.ingredients.some((i) => i.isHeader)).toBe(false);
});

test('friendly errors for missing recipes and HTTP failures', async () => {
  serve('<html>no recipe here</html>');
  await expect(fetchRecipeFromUrl('https://example.com/x')).rejects.toThrow(/No recipe data/);
  serve('', { ok: false, status: 404 });
  await expect(fetchRecipeFromUrl('https://example.com/x')).rejects.toThrow(/couldn't find that page/);
});
