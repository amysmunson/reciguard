import { getRecipes, saveRecipe } from '../../database/db';

const createEmptyRecipe = () => ({
  name: '',
  id: `temp-${Date.now()}`,
  ingredients: [],
  steps: [],
  authorNotes: [],
  userNotes: [],
});

const addRecipeAndNavigate = async ({ userId, navigation, onRecipesUpdated }) => {
  const newItem = createEmptyRecipe();

  await saveRecipe(userId, newItem);

  if (onRecipesUpdated) {
    const updatedRecipes = await getRecipes(userId);
    onRecipesUpdated(updatedRecipes);
  }

  navigation.navigate('InputSelector', { newItem, userId });
};

export { addRecipeAndNavigate };