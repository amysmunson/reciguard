import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import {
  BackIcon,
  CopyIcon,
  EllipsisIcon,
  FolderIcon,
  LinkIcon,
  RestoreIcon,
  StarIcon,
  TrashIcon,
} from '../components/icons';
import { colors } from '../styles/theme';
import { useFocusEffect } from '@react-navigation/native';
import styles from '../styles/main_style';
import { useAuth } from '../lib/server/auth-context';
import {
  getRecipe,
  setRecipeFavorite,
  duplicateRecipe,
  trashRecipe,
  restoreRecipes,
  deleteRecipesForever,
  trashPurgeDate,
  TRASH_RETENTION_DAYS,
} from '../lib/server/api/recipes';
import {
  getActiveAllergyDetails,
  ingredientAllergyInfo,
  normalizeSeverity,
  severityBackground,
  severityColor,
  severityLabel,
} from '../lib/server/api/allergies';
import { getMyProfile } from '../lib/server/api/profile';
import { loadJson, KEYS, recordRecipeOpened } from '../lib/app/storage';
import { cacheRecentRecipe, getCachedRecipe } from '../lib/app/recipeCache';
import { useCachedResource } from '../lib/app/cache';
import { usePullToRefresh } from '../lib/server/usePullToRefresh';
import { alertSaveFailed } from '../lib/server/connectivity';
import { normalizeRecipe } from '../lib/app/recipeItems';
import { formatMinutes } from '../lib/app/recipeTimes';
import { isSafeWebUrl } from '../lib/app/safeUrl';
import ActionMenu from '../components/ActionMenu';
import FolderPickerModal from '../components/FolderPickerModal';
import { MULTIPLIERS, formatAmount, scaleIngredient } from '../lib/app/scaleIngredient';
import { appAlert } from '../lib/app/dialog';

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const RecipeCard = ({ route, navigation }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [activeAllergies, setActiveAllergies] = useState([]);
  // Index of the ingredient whose allergy popup is open.
  const [expandedIndex, setExpandedIndex] = useState(null);
  // Amount multiplier for ingredient quantities (½×, 1×, 2×, 3×). Display
  // only — resets to 1× each time the recipe is opened.
  const [multiplier, setMultiplier] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
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
        const cached = normalizeRecipe(await getCachedRecipe(userId, recipeId));
        if (cached && !cancelled) setRecipe((prev) => prev ?? cached);
        // Record this open so Home's "Recently opened" sort can use it, and
        // so the recent-recipe cache keeps this one.
        if (userId) await recordRecipeOpened(userId, recipeId);
        try {
          const r = await getRecipe(recipeId);
          // Quiet background refresh: only re-render if something changed.
          if (!cancelled) setRecipe((prev) => (sameJson(prev, r) ? prev : r));
          if (userId) cacheRecentRecipe(userId, r);
        } catch (err) {
          if (!cancelled && !cached) {
            appAlert('Could not load recipe', err.message ?? 'Unknown error');
          }
        }
      };

      const loadFilter = async () => {
        if (!userId) return;
        try {
          const saved = await loadJson(KEYS.homeAllergyFilter(userId), {
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
    }, [recipeId, userId, myName])
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

  const {
    name,
    servings,
    ingredients,
    steps,
    userNotes,
    extLink,
    source,
    isFavorite,
    deletedAt,
    prepMinutes,
    cookMinutes,
    totalMinutes,
  } = recipe;
  const inTrash = !!deletedAt;
  const hasIngredients = ingredients.some((i) => !i.isHeader);
  const multiplierLabel = multiplier === 0.5 ? '½' : String(multiplier);
  // Servings follow the multiplier, e.g. "Makes 4 servings" -> 8 at 2×.
  const scaledServings = servings ? formatAmount(servings * multiplier) : null;
  const times = [
    prepMinutes && `Prep ${formatMinutes(prepMinutes)}`,
    cookMinutes && `Cook ${formatMinutes(cookMinutes)}`,
    totalMinutes && `Total ${formatMinutes(totalMinutes)}`,
  ]
    .filter(Boolean)
    // Non-breaking spaces keep "Cook 2 hr 15 min" on one line, so long
    // times wrap between entries rather than in the middle of one.
    .map((t) => t.replace(/ /g, '\u00A0'));

  const openSource = async () => {
    if (!extLink) return;
    // Web links only — never hand other schemes from recipe data to the OS.
    if (!isSafeWebUrl(extLink)) {
      appAlert('Cannot open link', "This recipe's source link isn't a web address.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(extLink);
      if (supported) await Linking.openURL(extLink);
      else appAlert('Cannot open link', extLink);
    } catch (err) {
      appAlert('Could not open link', err.message ?? 'Unknown error');
    }
  };

  // --- Actions --------------------------------------------------------------

  // Optimistic star toggle; reverts if the save fails.
  const toggleFavorite = async () => {
    const next = !isFavorite;
    setRecipe((prev) => ({ ...prev, isFavorite: next }));
    try {
      await setRecipeFavorite(recipeId, next);
    } catch (err) {
      setRecipe((prev) => ({ ...prev, isFavorite: !next }));
      alertSaveFailed(err, 'Could not update favorite');
    }
  };

  const handleCopy = async () => {
    try {
      const copy = await duplicateRecipe(recipe);
      navigation.push('RecipeCard', { recipeId: copy.id });
    } catch (err) {
      alertSaveFailed(err, 'Could not copy recipe');
    }
  };

  const handleTrash = () => {
    appAlert(
      'Delete recipe?',
      `It stays in Recently Deleted for ${TRASH_RETENTION_DAYS} days, so you can restore it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await trashRecipe(recipeId);
              navigation.goBack();
            } catch (err) {
              alertSaveFailed(err, 'Could not delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    try {
      await restoreRecipes([recipeId]);
      setRecipe((prev) => ({ ...prev, deletedAt: null }));
    } catch (err) {
      alertSaveFailed(err, 'Could not restore recipe');
    }
  };

  const handleDeleteForever = () => {
    appAlert('Delete forever?', 'This recipe will be permanently deleted. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Forever',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipesForever([recipeId]);
            navigation.goBack();
          } catch (err) {
            alertSaveFailed(err, 'Could not delete recipe');
          }
        },
      },
    ]);
  };

  const menuActions = inTrash
    ? [
        { key: 'restore', label: 'Restore', icon: <RestoreIcon />, onPress: handleRestore },
        {
          key: 'forever',
          label: 'Delete forever',
          icon: <TrashIcon size={18} />,
          onPress: handleDeleteForever,
          danger: true,
        },
      ]
    : [
        {
          key: 'folder',
          label: 'Add to folder',
          icon: <FolderIcon size={18} color={colors.textSecondary} />,
          onPress: () => setFolderPickerOpen(true),
        },
        { key: 'copy', label: 'Make a copy', icon: <CopyIcon />, onPress: handleCopy },
        {
          key: 'trash',
          label: 'Delete',
          icon: <TrashIcon size={18} />,
          onPress: handleTrash,
          danger: true,
        },
      ];

  // --- Rendering ------------------------------------------------------------

  const renderSectionHeader = (item, i) => (
    <Text key={i} style={[styles.recipeSection_header, contrast && { color: colors.text }]}>
      {item.text}
    </Text>
  );

  const renderIngredient = (item, i) => {
    if (item.isHeader) return renderSectionHeader(item, i);
    // Allergy matching runs on the original text; only the display is scaled.
    const info = ingredientAllergyInfo(item.text, activeAllergies);
    const isExpanded = expandedIndex === i;
    const displayText = scaleIngredient(item.text, multiplier);

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
          onPress={() => setExpandedIndex(isExpanded ? null : i)}
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
                        : !contrast && normalizeSeverity(p.severity) === 'mild' && styles.mildSeverityName,
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

  // Steps are numbered across sections; headers aren't numbered.
  let stepNumber = 0;
  const renderStep = (item, i) => {
    if (item.isHeader) return renderSectionHeader(item, i);
    stepNumber += 1;
    return (
      <Text key={i} style={styles.recipeItem}>
        {stepNumber}. {item.text}
      </Text>
    );
  };

  return (
    <ScrollView style={[styles.screen_base, styles.screen_cardPad]} refreshControl={refreshControl}>
      <TouchableOpacity style={[styles.overlay_base, styles.overlay_topLeft_card]} onPress={() => navigation.goBack()}>
        <BackIcon style={styles.overlayIcon_md} />
      </TouchableOpacity>

      <View style={[styles.overlay_base, styles.overlay_topRight_card, styles.recipeCard_actions]}>
        {!inTrash && (
          <TouchableOpacity
            onPress={toggleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityState={{ selected: isFavorite }}
          >
            <StarIcon filled={isFavorite} size={20} style={styles.recipeCard_star} />
          </TouchableOpacity>
        )}
        {!inTrash && (
          <TouchableOpacity onPress={() => navigation.navigate('EditRecipe', { recipeId })}>
            <Text style={styles.overlayText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="More actions"
        >
          <EllipsisIcon size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.card_headerRow}>
        <Text style={styles.header_card}>{name || 'Untitled'}</Text>
      </View>

      {inTrash && (
        <View style={styles.trashBanner}>
          <Text style={styles.trashBanner_text}>
            Recently deleted — deleted for good on{' '}
            {trashPurgeDate(deletedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
            . Use ⋯ to restore it.
          </Text>
        </View>
      )}

      {!!scaledServings && (
        <Text style={[styles.servings_display, contrast && { color: colors.text }]}>
          Makes {scaledServings} {scaledServings === '1' ? 'serving' : 'servings'}
        </Text>
      )}

      {times.length > 0 && (
        <Text style={[styles.recipeTimes_text, contrast && { color: colors.text }]}>
          {times.join('  ·  ')}
        </Text>
      )}

      <View style={styles.multiplier_headerRow}>
        <Text style={styles.header_section_marginless}>Ingredients</Text>
        {hasIngredients && (
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
        steps.map(renderStep)
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

      <ActionMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorStyle={styles.recipeCard_menu}
        actions={menuActions}
      />
      <FolderPickerModal
        visible={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        recipeId={recipeId}
      />
    </ScrollView>
  );
};

export default RecipeCard;
