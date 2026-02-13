import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../components/styles/main_style';
import { getRecipe } from '../lib/api/recipes';

const RecipeCard = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        try {
          const r = await getRecipe(recipeId);
          if (!cancelled) setRecipe(r);
        } catch (err) {
          if (!cancelled) Alert.alert('Could not load recipe', err.message ?? 'Unknown error');
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, [recipeId])
  );

  if (!recipe) {
    return (
      <View style={styles.card_container}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const { name, ingredients, steps, authorNotes, userNotes } = recipe;

  return (
    <ScrollView style={styles.card_container}>
      <TouchableOpacity style={styles.card_backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" style={styles.card_backIcon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card_edit}
        onPress={() => navigation.navigate('EditRecipe', { recipeId })}
      >
        <Text style={styles.card_editText}>Edit</Text>
      </TouchableOpacity>

      <Text style={styles.card_header}>{name || 'Untitled'}</Text>

      <Text style={styles.subheading}>Ingredients</Text>
      {ingredients.length > 0 ? (
        ingredients.map((item, i) => (
          <Text key={i} style={styles.ingredientItems}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.emptyText}>No items</Text>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.subheading}>Instructions</Text>
      {steps.length > 0 ? (
        steps.map((item, i) => (
          <Text key={i} style={styles.ingredientItems}>
            {i + 1}. {item}
          </Text>
        ))
      ) : (
        <Text style={styles.emptyText}>No items</Text>
      )}

      {authorNotes.length > 0 && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.subheading}>Author Notes</Text>
          {authorNotes.map((item, i) => (
            <Text key={i} style={styles.ingredientItems}>
              • {item}
            </Text>
          ))}
        </>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.subheading}>Your Notes</Text>
      {userNotes.length > 0 ? (
        userNotes.map((item, i) => (
          <Text key={i} style={styles.ingredientItems}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.emptyText}>No items</Text>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.spacing} />
    </ScrollView>
  );
};

export default RecipeCard;
