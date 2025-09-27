import React, { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/main_style';
import { useFocusEffect } from '@react-navigation/native';
import { updateRecipe } from '../database/db';



const RecipeCard = ({ route, navigation }) => {
  const { userId, recipe } = route.params;

  const [currentRecipe, setCurrentRecipe] = useState(recipe);

  // Refresh recipe from DB whenever screen is focused
  useFocusEffect(
  useCallback(() => {
    const loadRecipe = async () => {
      const allRecipes = await getRecipes(userId);
      const updatedRecipe = allRecipes.find(r => r.id === recipe.id);
      if (updatedRecipe) setCurrentRecipe(updatedRecipe);
    };
    loadRecipe();
  }, [userId, recipe.id])
);

  // const { recipeId, recipeName, ingredients, steps, authorNotes, userNotes } = route.params;
  const recipeId = currentRecipe.id;
  const recipeName = currentRecipe.name;
  const ingredients = currentRecipe.ingredients || [];
  const steps = currentRecipe.steps || [];
  const authorNotes = currentRecipe.authorNotes || [];
  const userNotes = currentRecipe.userNotes || [];

  console.log('RecipeCard Props:', { recipeId, recipeName, ingredients, steps, authorNotes, userNotes });

  return (
    <ScrollView style={styles.card_container}>
        <TouchableOpacity
            style={styles.card_backButton}
            onPress={() => navigation.goBack()}
        >
            <Text style={styles.bottomHugeButtonText}><Icon name="chevron-back" size={18} color="#333" /></Text>
        </TouchableOpacity>
        
      <Text style={styles.header}>{recipeName}</Text>
      {/* <AddTodo onAddTodo={addTodo} /> */}
      <Text style={styles.subheading}>{"Ingredients"}</Text>
      {ingredients.length > 0 ? (
        ingredients.map((item, index) => (
          <Text key={index} style={styles.ingredientItems}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={{ color: '#888' }}>No items</Text>
      )}
      <Text style={styles.spacing}>{}</Text>
      <Text style={styles.subheading}>{"Instructions"}</Text>
      {steps.length > 0 ? (
        steps.map((item, index) => (
          <Text key={index} style={styles.ingredientItems}>
            {index + 1}. {item}
          </Text>
        ))
      ) : (
        <Text style={{ color: '#888' }}>No items</Text>
      )}
      {authorNotes.length > 0 ? (<Text style={styles.spacing}>{}</Text>) : null}
      {authorNotes.length > 0 ? (<Text style={styles.subheading}>{"Author Notes"}</Text>) : null}
      {authorNotes.length > 0 ? (
        authorNotes.map((item, index) => (
          <Text key={index} style={styles.ingredientItems}> 
            • {item}
          </Text>
        ))
      ) : null }
      <Text style={styles.spacing}>{}</Text>
      <Text style={styles.subheading}>{"Your Notes"}</Text>
      {userNotes.length > 0 ? (
        userNotes.map((item, index) => (
          <Text key={index} style={styles.ingredientItems}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={{ color: '#888' }}>No items</Text>
      )}
      {/* Button to edit, temp */}
      {/* <TouchableOpacity style={styles.deleteButton} onPress={() => navigation.navigate('EditRecipe', { userid: userId, recipe: recipe})}>
            <Text style={styles.deleteButtonText}>Edit</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => navigation.navigate('EditRecipe', {
          userId,
          recipe: currentRecipe,
          onGoBack: (updatedRecipe) => setCurrentRecipe(updatedRecipe),
        })}
      >
        <Text style={styles.deleteButtonText}>Edit</Text>
      </TouchableOpacity>
      <Text style={styles.spacing}>{}</Text>
    </ScrollView>
  );
};

export default RecipeCard;
