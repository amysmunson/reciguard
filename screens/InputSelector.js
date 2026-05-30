import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { fetchRecipeFromUrl } from '../lib/recipeUrlParser';
import { createRecipe } from '../lib/api/recipes';

const InputSelector = ({ navigation }) => {
  // No recipe exists yet — we navigate to EditRecipe in "new" mode
  // (no recipeId). The DB insert happens when the user hits Save there,
  // or here in handleFetch when a URL is successfully parsed.
  const goToEdit = () => navigation.replace('EditRecipe');

  // 'picker' = three big buttons; 'link' = URL entry; (future) 'camera'
  const [mode, setMode] = useState('picker');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    setError(null);
    setLoading(true);
    try {
      const prefill = await fetchRecipeFromUrl(url);
      // Successful parse counts as the user committing to this recipe —
      // create the row directly, then drop back to Home so its focus
      // effect picks it up.
      await createRecipe({
        name: prefill.name,
        ingredients: prefill.ingredients,
        steps: prefill.steps,
        authorNotes: [],
        userNotes: [],
        source: prefill.source,
        extLink: prefill.extLink,
      });
      navigation.popToTop();
    } catch (err) {
      setError(err.message ?? 'Could not fetch that recipe.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'link') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.linkEntry_container}>
          <Text style={styles.linkEntry_title}>Add from a link</Text>
          <Text style={styles.linkEntry_hint}>
            Paste a recipe URL from AllRecipes, NYT Cooking, Food Network, or most
            recipe sites. We&apos;ll pull the name, ingredients, and steps.
          </Text>

          <TextInput
            style={styles.linkEntry_input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.allrecipes.com/recipe/..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            autoFocus
            editable={!loading}
            onSubmitEditing={handleFetch}
          />

          {!!error && <Text style={styles.linkEntry_error}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.linkEntry_fetchButton,
              (!url.trim() || loading) && { opacity: 0.5 },
            ]}
            onPress={handleFetch}
            disabled={!url.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.linkEntry_fetchButtonText}>Fetch recipe</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkEntry_backButton}
            onPress={() => {
              if (loading) return;
              setMode('picker');
              setError(null);
            }}
            disabled={loading}
          >
            <Text style={styles.linkEntry_backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => !loading && navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  // mode === 'picker'
  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.inputButton} onPress={() => setMode('link')}>
        <Icon name="link-outline" style={styles.inputButtonText} />
        <Text style={[styles.inputButtonText, { marginLeft: 10 }]}>From link</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.inputButton} onPress={goToEdit}>
        <Icon name="camera-outline" style={styles.inputButtonText} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.inputButton} onPress={goToEdit}>
        <Text style={styles.inputButtonText}>Manual Entry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InputSelector;
