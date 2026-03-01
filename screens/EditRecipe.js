import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles/main_style';
import { getRecipe, updateRecipe, deleteRecipe } from '../lib/api/recipes';

const EditRecipe = ({ route, navigation }) => {
  const { recipeId } = route.params;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [authorNotes, setAuthorNotes] = useState([]);
  const [userNotes, setUserNotes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await getRecipe(recipeId);
        setName(r.name);
        setIngredients(r.ingredients);
        setSteps(r.steps);
        setAuthorNotes(r.authorNotes);
        setUserNotes(r.userNotes);
      } catch (err) {
        Alert.alert('Could not load recipe', err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recipeId]);

  const addItem = (setter, list) => setter([...list, '']);
  const updateItem = (setter, list, index, text) => {
    const updated = [...list];
    updated[index] = text;
    setter(updated);
  };
  const removeItem = (setter, list, index) => {
    setter(list.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateRecipe(recipeId, {
        name,
        ingredients: ingredients.filter((s) => s.trim().length > 0),
        steps: steps.filter((s) => s.trim().length > 0),
        authorNotes: authorNotes.filter((s) => s.trim().length > 0),
        userNotes: userNotes.filter((s) => s.trim().length > 0),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete recipe?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipeId);
            navigation.popToTop();
          } catch (err) {
            Alert.alert('Could not delete', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.edit_container}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const renderList = (label, list, setter, placeholder, numbered = false) => (
    <>
      <Text style={styles.sectionHeader}>{label}</Text>
      {list.length === 0 && <Text style={styles.noItemsText}>No items yet.</Text>}
      {list.map((item, index) => (
        <View key={index} style={styles.ingredientRow}>
          {numbered && <Text>{index + 1}. </Text>}
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={(text) => updateItem(setter, list, index, text)}
            placeholder={placeholder}
          />
          <TouchableOpacity
            onPress={() => removeItem(setter, list, index)}
            style={styles.deleteButton}
          >
            <Icon name="trash-outline" size={24} color="#900" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => addItem(setter, list)}>
        <Icon name="add-circle-outline" size={32} color="#0066cc" />
        <Text style={styles.addButtonText}>Add {placeholder}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.edit_container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.edit_backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" style={styles.edit_backButtonIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteRecipeButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.edit_header, styles.edit_nameInput]}
          value={name}
          onChangeText={setName}
          placeholder="Recipe name"
        />

        {renderList('Ingredients', ingredients, setIngredients, 'Ingredient')}
        {renderList('Instructions', steps, setSteps, 'Step', true)}
        {renderList('Author Notes', authorNotes, setAuthorNotes, 'Note')}
        {renderList('Your Notes', userNotes, setUserNotes, 'Note')}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#28a745', padding: 20, marginBottom: 40 }]}
          onPress={handleSave}
        >
          <Text style={[styles.addButtonText, { color: '#fff', fontWeight: 'bold' }]}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditRecipe;
