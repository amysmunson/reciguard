jest.mock('../../lib/supabase', () => require('../helpers/fakeSupabase').module);
import * as fake from '../helpers/fakeSupabase';
import {
  getRecipes,
  getRecipe,
  createRecipe,
  trashRecipes,
  restoreRecipes,
  duplicateRecipe,
  setRecipesFavorite,
} from '../../lib/api/recipes';

const row = (overrides = {}) => ({
  id: 'r1',
  name: 'Soup',
  is_favorite: false,
  deleted_at: null,
  servings: null,
  prep_minutes: 10,
  cook_minutes: null,
  total_minutes: 10,
  author_notes: ['old note'],
  user_notes: ['mine'],
  recipe_ingredients: [
    { position: 1, text: 'salt', is_header: false },
    { position: 0, text: 'For the base', is_header: true },
  ],
  recipe_steps: [{ position: 0, text: 'Boil', is_header: false }],
  ...overrides,
});

beforeEach(() => fake.reset());

test('getRecipes is scoped to the user and excludes Recently Deleted', async () => {
  fake.state.respond = () => ({ data: [row()], error: null });
  const list = await getRecipes();
  const q = fake.state.log.find((e) => e.table === 'recipes');
  expect(fake.hasOp(q, 'eq', 'user_id', 'user-1')).toBe(true);
  expect(fake.hasOp(q, 'is', 'deleted_at', null)).toBe(true);
  // List summaries carry ingredient text without section headers.
  expect(list[0].ingredients).toEqual(['salt']);
});

test('getRecipe shapes headers, times, and merges legacy author notes', async () => {
  fake.state.respond = () => ({ data: row(), error: null });
  const r = await getRecipe('r1');
  expect(r.ingredients).toEqual([
    { text: 'For the base', isHeader: true },
    { text: 'salt', isHeader: false },
  ]);
  expect(r).toMatchObject({ servings: null, prepMinutes: 10, totalMinutes: 10 });
  expect(r.userNotes).toEqual(['old note', 'mine']);
});

test('createRecipe writes header flags and drops blank rows', async () => {
  fake.state.respond = (e) => (e.table === 'recipes' ? { data: row(), error: null } : { data: [], error: null });
  await createRecipe({
    name: 'Soup',
    ingredients: [{ text: 'For the base', isHeader: true }, { text: '  ', isHeader: false }, 'salt'],
    steps: [],
  });
  const insert = fake.state.log.find((e) => e.table === 'recipe_ingredients' && fake.opsOf(e, 'insert').length);
  expect(fake.opsOf(insert, 'insert')[0][1]).toEqual([
    { recipe_id: 'r1', position: 0, text: 'For the base', is_header: true },
    { recipe_id: 'r1', position: 1, text: 'salt', is_header: false },
  ]);
});

test('delete is a soft delete (Recently Deleted) and can be restored', async () => {
  await trashRecipes(['r1']);
  let q = fake.state.log.find((e) => e.table === 'recipes');
  expect(fake.opsOf(q, 'update')[0][1].deleted_at).toEqual(expect.any(String));
  fake.reset();
  await restoreRecipes(['r1']);
  q = fake.state.log.find((e) => e.table === 'recipes');
  expect(fake.opsOf(q, 'update')[0][1]).toEqual({ deleted_at: null });
});

test('favoriting does not bump updated_at', async () => {
  fake.state.respond = () => ({ data: row(), error: null });
  await setRecipesFavorite(['r1'], true);
  const q = fake.state.log.find((e) => e.table === 'recipes' && fake.opsOf(e, 'update').length);
  expect(fake.opsOf(q, 'update')[0][1]).toEqual({ is_favorite: true });
});

test('duplicateRecipe names the copy and does not copy the favorite flag', async () => {
  fake.state.respond = (e) => (e.table === 'recipes' ? { data: row(), error: null } : { data: [], error: null });
  await duplicateRecipe({ ...row(), name: 'Soup', isFavorite: true, ingredients: ['salt'], steps: [] });
  const insert = fake.state.log.find((e) => e.table === 'recipes' && fake.opsOf(e, 'insert').length);
  const values = fake.opsOf(insert, 'insert')[0][1];
  expect(values.name).toBe('Soup (copy)');
  expect(values.is_favorite).toBe(false);
});
