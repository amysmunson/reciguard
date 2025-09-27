import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles/main_style';
import { getDBConnection, updateRecipe } from '../database/db';
import { useFocusEffect } from '@react-navigation/native';


const EditRecipe = ({ route, navigation }) => {
  const { userId, recipe } = route.params;
  // const { recipeId, recipeName, ingredients, steps, authorNotes, userNotes } = route.params;
  // const [ingredients, setIngredients] = useState(ingredientsList || []);

  console.log('EditRecipe Props:', { userId, recipe }); 

  const [name, setName] = useState(recipe.name || '');
  const [recipeId, setRecipeId] = useState(recipe.id);
  const [ingredients, setIngredients] = useState(recipe.ingredients || []);
  const [steps, setSteps] = useState(recipe.steps || []);
  const [authorNotes, setAuthorNotes] = useState(recipe.authorNotes || []);
  const [userNotes, setUserNotes] = useState(recipe.userNotes || []);


  const addItem = (listSetter, list) => listSetter([...list, '']);
  const updateItem = (listSetter, list, index, text) => {
    const updated = [...list];
    updated[index] = text;
    listSetter(updated);
  };
  const removeItem = (listSetter, list, index) => {
    listSetter(list.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateRecipe(userId, recipeId, {
        name,
        ingredients,
        steps,
        authorNotes,
        userNotes,
      });
      console.log('✅ Recipe saved!');

      if (route.params.onGoBack) {
        route.params.onGoBack({
          ...recipe,
          name,
          ingredients,
          steps,
          authorNotes,
          userNotes,
        });
      }
      
      navigation.goBack(); // 2️⃣ only call once
    } catch (err) {
      console.error('❌ Failed to save recipe:', err);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: '#fff' }}
      contentContainerStyle={styles.edit_container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.edit_backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.edit_header}>{name}</Text>

      <Text style={styles.ingredients}>Ingredients</Text>

      {ingredients.length === 0 && (
        <Text style={styles.noItemsText}>No ingredients yet.</Text>
      )}

      {ingredients.map((item, index) => (
        <View key={index.toString()} style={styles.ingredientRow}>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(text) => updateItem(setIngredients, ingredients, index, text)}
            placeholder="Ingredient"
          />
          <TouchableOpacity onPress={() => removeItem(setIngredients, ingredients, index)} style={styles.deleteButton}>
            <Icon name="trash-outline" size={24} color="#900" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={() => addItem(setIngredients, ingredients)}>
        <Icon name="add-circle-outline" size={32} color="#0066cc" />
        <Text style={styles.addButtonText}>Add Ingredient</Text>
      </TouchableOpacity>

      {/* Instructions and Notes below */}
      <Text style={styles.sectionHeader}>Instructions</Text>
      {steps.length === 0 && (
        <Text style={styles.noItemsText}>No steps yet.</Text>
      )}

      {steps.map((item, index) => (
        <View key={index.toString()} style={styles.ingredientRow}>
          <Text>{index + 1}.  </Text>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(text) => updateItem(setSteps, steps, index, text)}
            placeholder="Step"
          />
          <TouchableOpacity onPress={() => removeItem(setSteps, steps, index)} style={styles.deleteButton}>
            <Icon name="trash-outline" size={24} color="#900" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={() => addItem(setSteps, steps)}>
        <Icon name="add-circle-outline" size={32} color="#0066cc" />
        <Text style={styles.addButtonText}>Add Step</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Author Notes</Text>
      {authorNotes.length === 0 && (
        <Text style={styles.noItemsText}>No notes yet.</Text>
      )}

      {authorNotes.map((item, index) => (
        <View key={index.toString()} style={styles.ingredientRow}>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(text) => updateItem(setAuthorNotes, authorNotes, index, text)}
            placeholder="Note"
          />
          <TouchableOpacity onPress={() => removeItem(setAuthorNotes, authorNotes, index)} style={styles.deleteButton}>
            <Icon name="trash-outline" size={24} color="#900" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={() => addItem(setAuthorNotes, authorNotes)}>
        <Icon name="add-circle-outline" size={32} color="#0066cc" />
        <Text style={styles.addButtonText}>Add Note</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Your Notes</Text>
      {userNotes.length === 0 && (
        <Text style={styles.noItemsText}>No notes yet.</Text>
      )}

      {userNotes.map((item, index) => (
        <View key={index.toString()} style={styles.ingredientRow}>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(text) => updateItem(setUserNotes, userNotes, index, text)}
            placeholder="Note"
          />
          <TouchableOpacity onPress={() => removeItem(setUserNotes, userNotes, index)} style={styles.deleteButton}>
            <Icon name="trash-outline" size={24} color="#900" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={() => addItem(setUserNotes, userNotes)}>
        <Icon name="add-circle-outline" size={32} color="#0066cc" />
        <Text style={styles.addButtonText}>Add Note</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#28a745', padding: 20, marginBottom: 40 }]}
        onPress={handleSave} // 3️⃣ simplified
      >
        <Text style={[styles.addButtonText, { color: '#fff', fontWeight: 'bold' }]}>
          Save Changes
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditRecipe;
