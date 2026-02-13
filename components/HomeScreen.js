import React, { useState, useCallback  } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Dimensions  } from 'react-native';
import CreateList from './CreateList';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sampleRecipes } from './samples/sample_recipes';
import styles from './styles/main_style';
import NavigationBar from './NavigationBar';
import { getDB, createTables, seedDatabase, getRecipes } from '../database/db';
import { addRecipeAndNavigate } from './utils/addRecipe';
import { useFocusEffect } from '@react-navigation/native';


const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [lists, setLists] = useState([]);

  
  //   Testing, populated with samples
  // const [lists, setLists] = useState(sampleRecipes);
  const [isCreating, setIsCreating] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const itemMargin = 20;
  const numColumns = 2;
  const itemSize = (screenWidth - (itemMargin * (numColumns + 1))) / numColumns;

  // Refresh recipes whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadRecipes = async () => {
        try {
          const recipes = await getRecipes(userId);
          setLists(recipes);
        } catch (err) {
          console.log("❌ HomeScreen error:", err);
        }
      };
      loadRecipes();
    }, [userId])
  );

  
  const handleAddRecipe = async () => {
    try {
      await addRecipeAndNavigate({ userId, navigation, onRecipesUpdated: setLists });
    } catch (err) {
      console.log("❌ handleAddRecipe error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.home_search} onPress={() => navigation.navigate('Home', { userId })}>
          <Icon name="search" style={styles.home_searchIcon}  />
        </TouchableOpacity>
      
      <Text style={styles.header}>Your Recipes</Text>
      <FlatList
        data={lists}
        numColumns={numColumns}
        renderItem={({ item }) => (
          // <TouchableOpacity onPress={() => navigation.navigate('RecipeCard', { recipeId: item.id, recipeName: item.name, ingredients: item.ingredients, steps: item.steps, authorNotes: item.authorNotes, userNotes: item.userNotes})}>
          <TouchableOpacity onPress={() => navigation.navigate('RecipeCard', { userId: userId, recipe: item})}>
            <View style={styles.listItem}>
              <Text style={styles.listItemText}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />

      <NavigationBar navigation={navigation} userId={userId} onAddPress={handleAddRecipe} />
  
    </View>
  );
};

// // This will need to change if you want the number of columns to be dependent on screen size
// const screenWidth = Dimensions.get('window').width;
// const itemMargin = 20;
// const numColumns = 2;
// const itemSize = (screenWidth - (itemMargin * (numColumns + 1))) / numColumns;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: itemMargin / 2,
//     paddingTop: 80,
//     paddingBottom: 20,
//     backgroundColor: '#fff',
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//     marginTop: 20,
//   },
//   listItem: {
//     width: itemSize,
//     height: itemSize,    // force square shape
//     margin: itemMargin / 2,
//     backgroundColor: '#f4f4f4',
//     borderRadius: 5,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   listItemText: {
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   addButton: {
//     position: 'absolute',
//     top: 45, // leave space for status bar
//     right: 10,
//     backgroundColor: '#ffffffff',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 5,
//   },
//   addButtonText: {
//     color: '#333',
//     fontSize: 24,
//     fontWeight: 'bold',
//   }
// });

export default HomeScreen;
