// Kicks off the "add a recipe" flow. Does NOT create a DB row — the row is
// only inserted when the user hits Save in EditRecipe.
export const startNewRecipe = ({ navigation }) => {
  navigation.navigate('InputSelector');
};
