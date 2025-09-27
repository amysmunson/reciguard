import * as SQLite from 'expo-sqlite';
import  { sampleRecipes }  from '../components/samples/sample_recipes';
import * as FileSystem from 'expo-file-system';

let dbPromise;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('recipes.db');
  }
  return dbPromise;
};

// Execute a single statement with params
const runSql = async (sql, params = []) => {
  const db = await getDB();
  return db.runAsync(sql, params); // returns a Promise
};

// Execute multiple statements
const execSql = async (sql) => {
  const db = await getDB();
  return db.execAsync(sql);
};

const createTables = async () => {
  await runSql(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      name TEXT,
      ingredients TEXT,
      steps TEXT,
      authorNotes TEXT,
      userNotes TEXT
    );
  `);
  console.log('✅ Table created');
  getRecipes('1234').then(recipes => {
    console.log('Current recipes in DB:', recipes);
  });
};

const isRecipesEmpty = async () => {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT COUNT(*) as count FROM recipes');
  return rows[0].count === 0;
};

const seedDatabase = async (userId = '1234') => {
  const empty = await isRecipesEmpty();
  if (!empty) {
    console.log('🔹 Recipes table already seeded, skipping...');
    return;
  }

  console.log('🔹 Seeding database...');
  console.log('Sample recipes to insert:', sampleRecipes);
  for (const recipe of sampleRecipes) {
    try {
      await runSql(
        `INSERT OR IGNORE INTO recipes
        (userId, name, ingredients, steps, authorNotes, userNotes)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          recipe.name,
          JSON.stringify(recipe.ingredients),
          JSON.stringify(recipe.steps),
          JSON.stringify(recipe.authorNotes),
          JSON.stringify(recipe.userNotes),
        ]
      );
      console.log('Inserted recipe:', recipe.name);
    } catch (err) {
      console.error('Error inserting recipe:', recipe.name, err);
    }
  }
  console.log('✅ Seeding done');
};

const getRecipes = async (userId) => {
  try {
    const db = await getDB();
    const result = await db.getAllAsync(`SELECT * FROM recipes WHERE userId = ?`, [userId]);
    return result.map(row => ({
      id: row.id.toString(),
      name: row.name,
      ingredients: JSON.parse(row.ingredients || '[]'),
      steps: JSON.parse(row.steps || '[]'),
      authorNotes: JSON.parse(row.authorNotes || '[]'),
      userNotes: JSON.parse(row.userNotes || '[]'),
    }));
  } catch (err) {
    console.error('❌ getRecipes error:', err);
    return [];
  }
};

const saveRecipe = async (userId, recipe) => {
  await runSql(
    `INSERT INTO recipes (userId, name, ingredients, steps, authorNotes, userNotes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      recipe.name,
      JSON.stringify(recipe.ingredients),
      JSON.stringify(recipe.steps),
      JSON.stringify(recipe.authorNotes),
      JSON.stringify(recipe.userNotes),
    ]
  );
};

const updateRecipe = async (userId, recipeId, recipe) => {
  await runSql(
    `UPDATE recipes
     SET name = ?, ingredients = ?, steps = ?, authorNotes = ?, userNotes = ?
     WHERE id = ? AND userId = ?`,
    [
      recipe.name,
      JSON.stringify(recipe.ingredients),
      JSON.stringify(recipe.steps),
      JSON.stringify(recipe.authorNotes),
      JSON.stringify(recipe.userNotes),
      recipeId,
      userId,
    ]
  );
};

const deleteDatabase = async () => {
  try {
    await runSql('DELETE FROM recipes'); // removes all rows
    console.log('✅ All recipes cleared!');
  } catch (err) {
    console.error('❌ Failed to clear recipes:', err);
  }
};

export { getDB, runSql, execSql, createTables, seedDatabase, getRecipes, saveRecipe, updateRecipe, deleteDatabase };
