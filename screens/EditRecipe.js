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
  Keyboard,
  InputAccessoryView,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { createRecipe, getRecipe, updateRecipe, deleteRecipe } from '../lib/api/recipes';
import { BackIcon, CheckIcon, PlusIcon, TrashIcon } from '../components/icons';
import ConfirmModal from '../components/ConfirmModal';
import OfflineBanner from '../components/OfflineBanner';
import { useUnsavedChangesGuard } from '../lib/unsavedChanges';
import { alertSaveFailed } from '../lib/connectivity';

// nativeID linking the multiline inputs to the iOS "Done" accessory bar.
const DONE_ACCESSORY_ID = 'editRecipeDone';

// Comparable form of the editable fields. Blank rows are ignored (they're
// dropped on save anyway), so adding then abandoning an empty row isn't
// treated as an unsaved change.
const snapshot = ({ name, servings, ingredients, steps, userNotes }) => {
  const clean = (list) => list.filter((s) => s.trim().length > 0);
  return JSON.stringify([
    name,
    String(servings ?? ''),
    clean(ingredients),
    clean(steps),
    clean(userNotes),
  ]);
};
const EMPTY_SNAPSHOT = snapshot({ name: '', servings: '', ingredients: [], steps: [], userNotes: [] });

// Servings input text -> positive integer, or null when blank/zero.
const parseServingsInput = (text) => {
  const n = parseInt(text, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const EditRecipe = ({ route, navigation }) => {
  const recipeId = route.params?.recipeId ?? null;
  const isNew = !recipeId;
  // If create new recipe, go back to home after saving
  const fromCreate = !!route.params?.fromCreate;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  // Kept as the raw input text; parsed to an integer (or null) on save.
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  // Snapshot of the last-loaded values; null while an existing recipe loads.
  const [baseline, setBaseline] = useState(isNew ? EMPTY_SNAPSHOT : null);

  const isDirty =
    baseline !== null &&
    snapshot({ name, servings, ingredients, steps, userNotes }) !== baseline;
  const { discardModalProps, leaveWithoutPrompt } = useUnsavedChangesGuard({
    navigation,
    isDirty,
  });

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const r = await getRecipe(recipeId);
        setName(r.name);
        setServings(r.servings ? String(r.servings) : '');
        setIngredients(r.ingredients);
        setSteps(r.steps);
        setUserNotes(r.userNotes);
        setBaseline(snapshot(r));
      } catch (err) {
        Alert.alert('Could not load recipe', err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recipeId, isNew]);

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
    if (saving) return;
    const payload = {
      name,
      servings: parseServingsInput(servings),
      ingredients: ingredients.filter((s) => s.trim().length > 0),
      steps: steps.filter((s) => s.trim().length > 0),
      userNotes: userNotes.filter((s) => s.trim().length > 0),
    };

    if (isNew && !payload.name && !payload.ingredients.length && !payload.steps.length) {
      Alert.alert('Nothing to save', 'Add at least a name, an ingredient, or a step.');
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await createRecipe(payload);
        leaveWithoutPrompt(() => navigation.popToTop());
      } else {
        await updateRecipe(recipeId, payload);
        leaveWithoutPrompt(() => (fromCreate ? navigation.popToTop() : navigation.goBack()));
      }
    } catch (err) {
      alertSaveFailed(err);
    } finally {
      setSaving(false);
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
            leaveWithoutPrompt(() => navigation.popToTop());
          } catch (err) {
            Alert.alert('Could not delete', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.screen_base, styles.screen_editPad]}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const renderList = (label, list, setter, placeholder, numbered = false) => (
    <>
      <Text style={[styles.header_section, { marginTop: 10, marginBottom: 10 }]}>{label}</Text>
      {list.length === 0 && <Text style={[styles.noItemsText, styles.text_body]}>No items yet.</Text>}
      {list.map((item, index) => (
        <View key={index} style={styles.ingredientRow}>
          {numbered && <Text style={[styles.recipeItem]}>{index + 1}. </Text>}
          <TextInput
            multiline
            scrollEnabled={false}
            style={[styles.input_base, styles.input_inRow, styles.text_body]}
            value={item}
            onChangeText={(text) => updateItem(setter, list, index, text)}
            placeholder={placeholder}
            inputAccessoryViewID={Platform.OS === 'ios' ? DONE_ACCESSORY_ID : undefined}
          />
          <TouchableOpacity
            onPress={() => removeItem(setter, list, index)}
            style={styles.deleteButton}
          >
            <TrashIcon size={20} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={() => addItem(setter, list)}>
        <PlusIcon size={16} color={colors.primary} strokeWidth={1.75} />
        <Text style={styles.addButtonText}>Add {placeholder}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.screen_baseScroll, styles.screen_editPad]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_safe]} onPress={() => navigation.goBack()}>
          <BackIcon style={styles.overlayIcon_sm} />
        </TouchableOpacity>

        {!isNew && (
          <TouchableOpacity style={styles.deleteRecipeButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.header_card, styles.input_underline]}
          value={name}
          onChangeText={setName}
          placeholder={isNew ? 'New recipe name' : 'Recipe name'}
        />
        <OfflineBanner />

        <View style={styles.servings_row}>
          <Text style={[styles.text_body, styles.servings_label]}>Makes</Text>
          <TextInput
            style={[styles.input_base, styles.servings_input, styles.text_body]}
            value={servings}
            onChangeText={(t) => setServings(t.replace(/[^0-9]/g, '').slice(0, 3))}
            placeholder="#"
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel="Number of servings"
            inputAccessoryViewID={Platform.OS === 'ios' ? DONE_ACCESSORY_ID : undefined}
          />
          <Text style={[styles.text_body, styles.servings_label]}>servings</Text>
        </View>

        {renderList('Ingredients', ingredients, setIngredients, 'Ingredient')}
        {renderList('Instructions', steps, setSteps, 'Step', true)}
        {renderList('Your Notes', userNotes, setUserNotes, 'Note')}

        <TouchableOpacity
          style={[styles.button_base, styles.button_fullWidth, styles.button_primary, { marginTop: 30 }]}
          onPress={handleSave}
        >
          <Text style={[styles.buttonText_base, styles.buttonText_onPrimary]}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* iOS-only "Done" bar above the keyboard — the multiline inputs use
          Return for newlines, so this is how you dismiss the keyboard. */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={DONE_ACCESSORY_ID}>
          <View style={styles.inputAccessory_bar}>
            <TouchableOpacity style={styles.inputAccessory_doneButton} onPress={Keyboard.dismiss}>
              <CheckIcon size={18} color={colors.primary} />
              <Text style={styles.inputAccessory_doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      <ConfirmModal {...discardModalProps} />
    </KeyboardAvoidingView>
  );
};

export default EditRecipe;
