import { createRecipe, getRecipes } from '../../lib/api/recipes';

export const addRecipeAndNavigate = async ({ navigation, onRecipesUpdated }) => {
  const created = await createRecipe({ name: '' });

  if (onRecipesUpdated) {
    const updated = await getRecipes();
    onRecipesUpdated(updated);
  }

  navigation.navigate('InputSelector', { recipeId: created.id });
};
