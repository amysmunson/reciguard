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
import { cacheRecentRecipe, getCachedRecipe } from '../lib/recipeCache';
import { useCachedResource } from '../lib/cache';
import { usePullToRefresh } from '../lib/usePullToRefresh';
import OfflineBanner from '../components/OfflineBanner';
import { MULTIPLIERS, formatAmount, scaleIngredient } from '../lib/scaleIngredient';

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const RecipeCard = ({ route, navigation }) => {
  const { user } = useAuth();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [activeAllergies, setActiveAllergies] = useState([]);
  const [expandedIngredient, setExpandedIngredient] = useState(null);
  // Amount multiplier for ingredient quantities (½×, 1×, 2×, 3×). Display
  // only — resets to 1× each time the recipe is opened.
  const [multiplier, setMultiplier] = useState(1);
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

      // Paint the cached copy (one of the last few opened) immediately, then
      // revalidate from the server. If that fails — e.g. offline — keep
      // showing the cached copy rather than an error.
      const loadRecipe = async () => {
        const cached = await getCachedRecipe(user?.id, recipeId);
        if (cached && !cancelled) setRecipe((prev) => prev ?? cached);
        // Record this open so Home's "Recently opened" sort can use it, and
        // so the recent-recipe cache keeps this one.
        if (user?.id) await recordRecipeOpened(user.id, recipeId);
        try {
          const r = await getRecipe(recipeId);
          // Quiet background refresh: only re-render if something changed.
          if (!cancelled) setRecipe((prev) => (sameJson(prev, r) ? prev : r));
          if (user?.id) cacheRecentRecipe(user.id, r);
        } catch (err) {
          if (!cancelled && !cached) {
            Alert.alert('Could not load recipe', err.message ?? 'Unknown error');
          }
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

  // Pull down to refetch the recipe from the server (and refresh its cached
  // copy). On failure the current copy stays up; the offline banner covers it.
  const refreshControl = usePullToRefresh(async () => {
    const r = await getRecipe(recipeId);
    setRecipe(r);
    if (user?.id) cacheRecentRecipe(user.id, r);
  });

  if (!recipe) {
    return (
      <View style={[styles.screen_base, styles.screen_cardPad]}>
        <Text style={[styles.emptyText, { marginTop: 100 }, contrast && { color: colors.text }]}>Loading…</Text>
      </View>
    );
  }

  const { name, servings, ingredients, steps, userNotes, extLink, source } = recipe;
  const multiplierLabel = multiplier === 0.5 ? '½' : String(multiplier);
  // Servings follow the multiplier, e.g. "Makes 4 servings" -> 8 at 2×.
  const scaledServings = servings ? formatAmount(servings * multiplier) : null;

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
    // Allergy matching runs on the original text; only the display is scaled.
    const info = ingredientAllergyInfo(item, activeAllergies);
    const isExpanded = expandedIngredient === item;
    const displayText = scaleIngredient(item, multiplier);

    if (!info) {
      return (
        <Text key={i} style={styles.recipeItem}>
          • {displayText}
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
            • {displayText}
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
    <ScrollView style={[styles.screen_base, styles.screen_cardPad]} refreshControl={refreshControl}>
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
      <OfflineBanner />

      {!!scaledServings && (
        <Text style={[styles.servings_display, contrast && { color: colors.text }]}>
          Makes {scaledServings} {scaledServings === '1' ? 'serving' : 'servings'}
        </Text>
      )}

      <View style={styles.multiplier_headerRow}>
        <Text style={styles.header_section_marginless}>Ingredients</Text>
        {ingredients.length > 0 && (
          <View style={styles.multiplier_row} accessibilityRole="radiogroup">
            {MULTIPLIERS.map((m) => {
              const selected = m.value === multiplier;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMultiplier(m.value)}
                  style={[styles.multiplier_chip, selected && styles.multiplier_chipSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${m.value} times amounts`}
                >
                  <Text
                    style={[
                      styles.multiplier_chipText,
                      selected && styles.multiplier_chipTextSelected,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
      {multiplier !== 1 && (
        <Text style={[styles.readOnly_hint, { marginTop: 0 }, contrast && { color: colors.text }]}>
          {servings
            ? `Ingredient amounts scaled ${multiplierLabel}× from ${servings} to ${scaledServings} servings.`
            : `Ingredient amounts shown at ${multiplierLabel}×.`}{' '}
          Amounts in the instructions aren&apos;t adjusted.
        </Text>
      )}
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
