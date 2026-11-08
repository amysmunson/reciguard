// Edits a working copy of the allergy list. Doesn't get saved to the db until Save is pressed
// Save then writes the diff against the list the caller (Profile or FriendProfile) originally passed in via
// route.params.allergies. Leaving with unsaved changes (back button, swipe, hardware back)
// asks before discarding. severity is set per-row at the top

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/main_style';
import { RestoreIcon, TrashIcon } from '../components/icons';
import { colors } from '../styles/theme';
import {
  severityColor,
  severityLabel,
  normalizeSeverity,
  makeLocalAllergyId,
  syncAllergies,
} from '../lib/server/api/allergies';
import AllergyChecklist from '../components/AllergyChecklist';
import ConfirmModal from '../components/ConfirmModal';
import { EditHeader } from '../components/EditHeader';
import { appAlert } from '../lib/app/dialog';
import { useUnsavedChangesGuard } from '../lib/app/unsavedChanges';
import { alertSaveFailed } from '../lib/server/connectivity';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// The 4 severity levels a saved allergen can carry. null = unspecified/unknown
const SEVERITY_CHOICES = [null, 'mild', 'moderate', 'severe'];

// Order-independent name+severity signature, the same fields syncAllergies diffs on.
const signature = (list) =>
  list
    .map((a) => `${a.name.toLowerCase()}:${normalizeSeverity(a.severity)}`)
    .sort()
    .join('|');

const EditAllergies = ({ navigation, route }) => {
  const { allergies: initialAllergies = [], friendId = null } = route.params;
  const [items, setItems] = useState(initialAllergies);
  const [saving, setSaving] = useState(false);

  const isDirty = signature(items) !== signature(initialAllergies);
  const { discardModalProps, leaveWithoutPrompt } = useUnsavedChangesGuard({
    navigation,
    isDirty,
  });

  const handleSetSeverity = (id, severity) => {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, severity } : a)));
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAdd = (name, userCustom) => {
    setItems((prev) => {
      if (prev.some((a) => a.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { id: makeLocalAllergyId(), name, severity: null, userCustom, friendId }];
    });
  };

  const handleRemoveByName = (name) => {
    setItems((prev) => prev.filter((a) => a.name.toLowerCase() !== name.toLowerCase()));
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      // diff the original list against the updated list and send only the changes to the server
      await syncAllergies({ original: initialAllergies, updated: items, friendId });
      leaveWithoutPrompt(() => navigation.goBack());
    } catch (err) {
      alertSaveFailed(err);
    } finally {
      setSaving(false);
    }
  };

  // ⋯ menu. Both only change the working copy — nothing is saved until Save.
  const confirmThen = (title, message, label, action) =>
    appAlert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, style: 'destructive', onPress: action },
    ]);
  const menuActions = [
    ...(items.length
      ? [
          {
            key: 'removeAll',
            label: 'Remove all',
            icon: <TrashIcon size={18} />,
            danger: true,
            onPress: () =>
              confirmThen(
                'Remove all dietary needs?',
                "They'll be removed when you tap Save.",
                'Remove All',
                () => setItems([])
              ),
          },
        ]
      : []),
    ...(isDirty
      ? [
          {
            key: 'discard',
            label: 'Discard changes',
            icon: <RestoreIcon color={colors.textSecondary} />,
            onPress: () =>
              confirmThen("Discard changes?", "Your edits haven't been saved.", 'Discard', () =>
                setItems(initialAllergies)
              ),
          },
        ]
      : []),
  ];

  return (
    <ScrollView
      style={[styles.screen_base, styles.screen_cardPad]}
      contentContainerStyle={{ paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
    >
      <EditHeader
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        saving={saving}
        menuActions={menuActions}
      />

      <Text style={styles.header_card}>Edit Dietary Needs</Text>

      {/* Legend to explain severity colors */}
      <View style={styles.severityLegend_row}>
        {SEVERITY_CHOICES.map((choice) => (
          <View key={choice ?? 'unknown'} style={styles.severityLegend_item}>
            <View style={[styles.severityDot, { backgroundColor: severityColor(choice) }]} />
            <Text style={styles.severityLegend_label}>{severityLabel(choice)}</Text>
          </View>
        ))}
      </View>

      {/* List of allergies */}
      {items.length === 0 && <Text style={styles.emptyText}>None added.</Text>}
      {items.map((a) => (
        <View key={a.id} style={styles.allergyRow}>
          <Text style={[styles.recipeItem, { flex: 1 }]}>• {cap(a.name)}</Text>
          <View style={styles.severityChoice_row}>
            {SEVERITY_CHOICES.map((choice) => {
              const isSelected = normalizeSeverity(a.severity) === normalizeSeverity(choice);
              const color = severityColor(choice);
              return (
                <TouchableOpacity
                  key={choice ?? 'unknown'}
                  onPress={() => handleSetSeverity(a.id, choice)}
                  style={[
                    styles.severityChoice_hitArea,
                    isSelected && { borderColor: color },
                  ]}
                >
                  <View style={[styles.severityChoice_dot, { backgroundColor: color }]} />
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => handleRemove(a.id)} style={styles.deleteButton}>
            <TrashIcon />
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.readOnly_hint, { marginBottom: 8 }]}>
        Some allergies and restrictions are harder to catch automatically (like corn in the corn syrup of marshmallows).
        Be sure to check for hidden or alternate ingredient names, cross-contamination, and ingredients within other ingredients. 
        Always check the specific ingredients in a recipe yourself.
      </Text>

      {/* Checklist for adding */}
      <AllergyChecklist
        existingNames={items.map((a) => a.name)}
        onAdd={handleAdd}
        onRemove={handleRemoveByName}
      />

      <ConfirmModal {...discardModalProps} />
    </ScrollView>
  );
};

export default EditAllergies;
