import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../components/styles/main_style';
import NavigationBar from '../components/NavigationBar';
import { addRecipeAndNavigate } from '../components/utils/addRecipe';
import { getRecipes } from '../lib/api/recipes';

const Home = ({ navigation }) => {
  const [recipes, setRecipes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        try {
          const list = await getRecipes();
          if (!cancelled) setRecipes(list);
        } catch (err) {
          if (!cancelled) Alert.alert('Could not load recipes', err.message ?? 'Unknown error');
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleAddRecipe = async () => {
    try {
      await addRecipeAndNavigate({ navigation, onRecipesUpdated: setRecipes });
    } catch (err) {
      Alert.alert('Could not create recipe', err.message ?? 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.home_search} onPress={() => {}}>
        <Icon name="search" style={styles.home_searchIcon} />
      </TouchableOpacity>

      <Text style={styles.header}>Your Recipes</Text>

      <FlatList
        data={recipes}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('RecipeCard', { recipeId: item.id })}
          >
            <View style={styles.listItem}>
              <Text style={styles.listItemText}>{item.name || 'Untitled'}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recipes yet. Tap + to add one.</Text>
        }
      />

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Home;
