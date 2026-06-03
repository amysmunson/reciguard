import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { BackIcon, ExternalLinkIcon } from '../components/icons';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { useAuth } from '../lib/auth-context';
import { getRecipe } from '../lib/api/recipes';
import {
  getActiveAllergyDetails,
  ingredientAllergyInfo,
  severityColor,
  severityLabel,
} from '../lib/api/allergies';
import { getMyProfile } from '../lib/api/profile';
import { loadJson, KEYS, recordRecipeOpened } from '../lib/storage';

const RecipeCard = ({ route, navigation }) => {
  const { user } = useAuth();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [activeAllergies, setActiveAllergies] = useState([]);
  const [expandedIngredient, setExpandedIngredient] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadRecipe = async () => {
        try {
          const r = await getRecipe(recipeId);
          if (!cancelled) setRecipe(r);
          // Record this open so Home's "Recently opened" sort can use it.
          if (user?.id) recordRecipeOpened(user.id, recipeId);
        } catch (err) {
          if (!cancelled) Alert.alert('Could not load recipe', err.message ?? 'Unknown error');
        }
      };

      const loadFilter = async () => {
        if (!user?.id) return;
        try {
          const saved = await loadJson(KEYS.homeAllergyFilter(user.id), {
            includeSelf: false,
            friendIds: [],
          });
          const profile = await getMyProfile();
          const details = await getActiveAllergyDetails({
            includeSelf: !!saved.includeSelf,
            friendshipIds: saved.friendIds ?? [],
            myName: profile?.name?.trim() || 'Me',
          });
          if (!cancelled) setActiveAllergies(details);
        } catch {
          // non-fatal — recipe still renders without allergy info
        }
      };

      loadRecipe();
      loadFilter();
      return () => {
        cancelled = true;
      };
    }, [recipeId, user?.id])
  );

  if (!recipe) {
    return (
      <View style={styles.card_container}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }

  const { name, ingredients, steps, authorNotes, userNotes, extLink, source } = recipe;

  const openSource = async () => {
    if (!extLink) return;
    try {
      const supported = await Linking.canOpenURL(extLink);
      if (supported) await Linking.openURL(extLink);
      else Alert.alert('Cannot open link', extLink);
    } catch (err) {
      Alert.alert('Could not open link', err.message ?? 'Unknown error');
    }
  };

  const renderIngredient = (item, i) => {
    const info = ingredientAllergyInfo(item, activeAllergies);
    const isExpanded = expandedIngredient === item;

    if (!info) {
      return (
        <Text key={i} style={styles.ingredientItems}>
          • {item}
        </Text>
      );
    }

    return (
      <View key={i}>
        <TouchableOpacity
          onPress={() => setExpandedIngredient(isExpanded ? null : item)}
          style={[
            styles.ingredientHighlight,
            { backgroundColor: info.background, borderColor: info.color },
          ]}
        >
          <Text style={[styles.ingredientItems, { flex: 1, marginVertical: 0 }]}>
            • {item}
          </Text>
          <View style={[styles.allergyDot, { backgroundColor: info.color, marginLeft: 8 }]} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.allergyPopup, { borderLeftColor: info.color }]}>
            <Text style={styles.allergyPopup_severity}>
              Worst: {severityLabel(info.severity)}
            </Text>
            <Text style={styles.allergyPopup_names}>
              {info.people.map((p, idx) => (
                <Text
                  key={p.name + idx}
                  style={{ color: severityColor(p.severity), fontWeight: 'bold' }}
                >
                  {p.name}
                  {idx < info.people.length - 1 ? ', ' : ''}
                </Text>
              ))}
              {info.people.length === 1 ? ' is allergic.' : ' are allergic.'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.screen_base, styles.screen_cardPad]}>
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_card]} onPress={() => navigation.goBack()}>
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card_edit}
        onPress={() => navigation.navigate('EditRecipe', { recipeId })}
      >
        <Text style={styles.card_editText}>Edit</Text>
      </TouchableOpacity>

      <View style={styles.card_headerRow}>
        <Text style={styles.card_header}>{name || 'Untitled'}</Text>
        {!!extLink && (
          <TouchableOpacity
            onPress={openSource}
            style={styles.card_sourceLink}
            accessibilityLabel={source ? `Open original on ${source}` : 'Open original recipe'}
          >
            <ExternalLinkIcon />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subheading}>Ingredients</Text>
      {ingredients.length > 0 ? (
        ingredients.map(renderIngredient)
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
