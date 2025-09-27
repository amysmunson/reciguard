import React, { useState, useCallback  } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Dimensions  } from 'react-native';
import CreateList from './CreateList';
import Icon from 'react-native-vector-icons/FontAwesome';
import { sampleRecipes } from './samples/sample_recipes';
import styles from './styles/main_style';
import { getDB, createTables, seedDatabase, getRecipes, saveRecipe } from '../database/db';
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
    const newItem = {
      name: '',
      id: `temp-${Date.now()}`, // temporary ID
      ingredients: [],
      steps: [],
      authorNotes: [],
      userNotes: []
    };

    const db = await getDB();
    await saveRecipe(db, userId, newItem);

    const updatedRecipes = await getRecipes(db, userId);
    setLists(updatedRecipes);

    navigation.navigate('InputSelector', { newItem, userId });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.home_addButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        
        onPress={() => handleAddRecipe()}
      >
        <Icon name="plus-square-o" style={styles.home_addButtonText}/>
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

      {/* Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}  onPress={() => navigation.navigate('Home', { userId })}>
          <Icon name="home" style={styles.navButtonIcon} />
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => handleAddRecipe()}>
          <Icon name="plus-square-o" style={styles.navButtonIcon} />
          <Text style={styles.navButtonText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home', { userId })}>
          <Icon name="search" style={styles.navButtonIcon}  />
          <Text style={styles.navButtonText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings', { userId })}>
          <Icon name="cogs" style={styles.navButtonIcon}  />
          <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home', { userId })}>
          <Icon name="folder" style={styles.navButtonIcon} />
          <Text style={styles.navButtonText}>Folders</Text>
        </TouchableOpacity>
      </View>
  
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
