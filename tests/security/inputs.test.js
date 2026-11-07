// Untrusted input: links pasted or imported by users, and text sent to the
// database.
jest.mock('../../lib/supabase', () => require('../helpers/fakeSupabase').module);
import { isSafeWebUrl } from '../../lib/safeUrl';
import { fetchRecipeFromUrl } from '../../lib/recipeUrlParser';
import { submitFeedback, FEEDBACK_MAX_LENGTH } from '../../lib/api/feedback';
import * as fake from '../helpers/fakeSupabase';
const { read } = require('../helpers/repoFiles');

describe('external links', () => {
  test.each([
    ['https://www.allrecipes.com/recipe/1', true],
    ['http://example.com/r', true],
    ['javascript:alert(1)', false],
    ['file:///etc/passwd', false],
    ['tel:5551234', false],
    ['sms:5551234', false],
    ['data:text/html,<script>x</script>', false],
    ['myapp://open?x=1', false],
    ['', false],
    [null, false],
  ])('isSafeWebUrl(%p) → %p', (url, ok) => expect(isSafeWebUrl(url)).toBe(ok));

  test('RecipeCard only opens source links that pass isSafeWebUrl', () => {
    const src = read('screens/RecipeCard.js');
    const open = src.indexOf('Linking.openURL');
    const guard = src.indexOf('isSafeWebUrl(extLink)');
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(open);
  });
});

describe('recipe import', () => {
  test.each(['javascript:alert(1)', 'file:///etc/passwd', 'ftp://x.com/r', 'example.com/no-scheme'])(
    'refuses non-http(s) URL %p without fetching',
    async (url) => {
      global.fetch = jest.fn();
      await expect(fetchRecipeFromUrl(url)).rejects.toThrow(/http:\/\/ or https:\/\//);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  test('refuses oversized pages (declared or actual) instead of parsing them', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, headers: { get: () => String(50 * 1024 * 1024) }, text: async () => '' }));
    await expect(fetchRecipeFromUrl('https://example.com/huge')).rejects.toThrow(/too large/);
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => 'x'.repeat(6 * 1024 * 1024) }));
    await expect(fetchRecipeFromUrl('https://example.com/huge')).rejects.toThrow(/too large/);
  });

  test('a page script cannot inject executable content — imported text is plain text', async () => {
    const ld = { '@type': 'Recipe', name: '<img src=x onerror=alert(1)>Pie', recipeIngredient: ['<script>steal()</script>1 egg'], recipeInstructions: ['Bake.'] };
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, headers: { get: () => null }, // Pages escape '</' inside JSON-LD, as real recipe sites do.
      text: async () => `<script type="application/ld+json">${JSON.stringify(ld).replace(/<\//g, '<\\/')}</script>` }));
    const r = await fetchRecipeFromUrl('https://example.com/r');
    expect(r.name).toBe('Pie');
    expect(r.ingredients[0].text).not.toMatch(/<script|onerror/);
  });
});

describe('feedback submissions', () => {
  beforeEach(() => fake.reset());

  test('rejects empty, oversized, and unknown-type submissions before sending', async () => {
    await expect(submitFeedback({ type: 'suggestion', message: '   ' })).rejects.toThrow(/empty/);
    await expect(submitFeedback({ type: 'suggestion', message: 'x'.repeat(FEEDBACK_MAX_LENGTH + 1) })).rejects.toThrow(/at most/);
    await expect(submitFeedback({ type: 'question', message: 'hi' })).rejects.toThrow(/Unknown/);
    expect(fake.state.log).toEqual([]);
  });

  test('sends trimmed text tagged with the signed-in user', async () => {
    await submitFeedback({ type: 'suggestion', message: '  Love it  ' });
    const insert = fake.state.log.find((e) => e.table === 'feedback_submissions');
    expect(fake.opsOf(insert, 'insert')[0][1]).toEqual({ user_id: 'user-1', type: 'suggestion', message: 'Love it' });
  });

  test('the Feedback form caps input length', () => {
    expect(read('screens/Feedback.js')).toMatch(/maxLength=\{FEEDBACK_MAX_LENGTH\}/);
  });
});
