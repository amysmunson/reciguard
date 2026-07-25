import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { BackIcon, LinkIcon } from '../components/icons';
import {colors} from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { useAuth } from '../lib/auth-context';
import { getRecipe } from '../lib/api/recipes';
import {
  getActiveAllergyDetails,
  ingredientAllergyInfo,
  normalizeSeverity,
  severityBackground,
  severityColor,
  severityLabel,
} from '../lib/api/allergies';
import { getMyProfile } from '../lib/api/profile';
import { loadJson, KEYS, recordRecipeOpened } from '../lib/storage';
import { useCachedResource } from '../lib/cache';

const RecipeCard = ({ route, navigation }) => {
  const { user } = useAuth();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [activeAllergies, setActiveAllergies] = useState([]);
  const [expandedIngredient, setExpandedIngredient] = useState(null);
  const { data: profile } = useCachedResource({
    resource: 'profile',
    userId: user?.id,
    fetcher: getMyProfile,
  });
  const contrast = !!profile?.contrast;
  const myName = profile?.name?.trim() || 'Me';

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
          const details = await getActiveAllergyDetails({
            includeSelf: !!saved.includeSelf,
            friendshipIds: saved.friendIds ?? [],
            myName,
          });
          if (!cancelled) setActiveAllergies(details);
        } catch {
          // recipe renders without allergy info
        }
      };

      loadRecipe();
      loadFilter();
      return () => {
        cancelled = true;
      };
    }, [recipeId, user?.id, myName])
  );

  if (!recipe) {
    return (
      <View style={[styles.screen_base, styles.screen_cardPad]}>
        <Text style={[styles.emptyText, { marginTop: 100 }, contrast && { color: colors.text }]}>Loading…</Text>
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
        <Text key={i} style={styles.recipeItem}>
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
          <Text style={[styles.recipeItem, { flex: 1, marginVertical: 0 }]}>
            • {item}
          </Text>
          <View style={[styles.allergyDot, { backgroundColor: info.color, marginLeft: 8 }]} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.allergyPopup, { borderLeftColor: info.color }]}>
            <Text style={[styles.allergyPopup_severity, contrast && { color: colors.text }]}>
              Worst: {severityLabel(info.severity)}
            </Text>
            <Text style={[styles.allergyPopup_names, contrast && { color: colors.text }]}>
              {'Dietary Restriction for: '}
              {info.people.map((p, idx) => (
                <Text key={p.name + idx}>
                  <Text
                    style={[
                      {
                        color: contrast ? colors.text : severityColor(p.severity),
                        fontWeight: 'bold',
                      },
                      contrast && normalizeSeverity(p.severity) !== 'unknown'
                        ? {
                            backgroundColor: severityBackground(p.severity),
                            paddingHorizontal: 4,
                            borderRadius: 4,
                          }
                        : !contrast && normalizeSeverity(p.severity) === 'mild' && {
                            color: '#000000',
                            textShadowColor: '#ffd000',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 6,
                          },
                    ]}
                  >
                    {p.name}
                  </Text>
                  {idx < info.people.length - 1 ? ', ' : ''}
                </Text>
              ))}
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
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={() => navigation.navigate('EditRecipe', { recipeId })}
      >
        <Text style={styles.overlayText}>Edit</Text>
      </TouchableOpacity>

      <View style={styles.card_headerRow}>
        <Text style={styles.header_card}>{name || 'Untitled'}</Text>
      </View>

      <Text style={styles.header_section}>Ingredients</Text>
      {ingredients.length > 0 ? (
        ingredients.map(renderIngredient)
      ) : (
        <Text style={[styles.emptyText, contrast && { color: colors.text }]}>No items</Text>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>Instructions</Text>
      {steps.length > 0 ? (
        steps.map((item, i) => (
          <Text key={i} style={styles.recipeItem}>
            {i + 1}. {item}
          </Text>
        ))
      ) : (
        <Text style={[styles.emptyText, contrast && { color: colors.text }]}>No items</Text>
      )}

      {authorNotes.length > 0 && (
        <>
          <Text style={styles.spacing} />
          <Text style={styles.header_section}>Author Notes</Text>
          {authorNotes.map((item, i) => (
            <Text key={i} style={styles.recipeItem}>
              • {item}
            </Text>
          ))}
        </>
      )}

      <Text style={styles.spacing} />
      <Text style={styles.header_section}>Your Notes</Text>
      {userNotes.length > 0 ? (
        userNotes.map((item, i) => (
          <Text key={i} style={styles.recipeItem}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={[styles.emptyText, contrast && { color: colors.text }]}>No items</Text>
      )}

      {!!extLink && (
          <TouchableOpacity
            onPress={openSource}
            style={[styles.card_sourceLink]}
            accessibilityLabel={source ? `Open original on ${source}` : 'Open original recipe'}
          >
            <LinkIcon size={18} color={colors.primary} />
            <Text style={[styles.recipeItem, { color: colors.primary, fontWeight: 'bold' }]}> 
              Original Recipe
            </Text>
          </TouchableOpacity>
        )}

      <Text style={styles.spacing} />
      <Text style={styles.spacing} />
    </ScrollView>
  );
};

export default RecipeCard;
