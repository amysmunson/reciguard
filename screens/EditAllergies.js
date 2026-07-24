// Edits a working copy of the allergy list. Doesn't get saved to the db until Save is pressed
// Save then writes the diff against the list the caller (Profile or FriendProfile) originally passed in via
// route.params.allergies. Swipe-to-dismiss discards. severity is set per-row at the top

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon, TrashIcon } from '../components/icons';
import {
  severityColor,
  severityLabel,
  normalizeSeverity,
  makeLocalAllergyId,
  syncAllergies,
} from '../lib/api/allergies';
import AllergyChecklist from '../components/AllergyChecklist';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// The 4 severity levels a saved allergen can carry. null = unspecified/unknown
const SEVERITY_CHOICES = [null, 'mild', 'moderate', 'severe'];

const EditAllergies = ({ navigation, route }) => {
  const { allergies: initialAllergies = [], friendId = null } = route.params;
  const [items, setItems] = useState(initialAllergies);
  const [saving, setSaving] = useState(false);

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
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', err.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen_base, styles.screen_cardPad]}
      contentContainerStyle={{ paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
    >
      {/* Back button */}
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_card]}
        onPress={() => navigation.goBack()}
      >
        <BackIcon style={styles.overlayIcon_sm} />
      </TouchableOpacity>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topRight_card]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.overlayText}>{saving ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>

      <Text style={styles.header_card}>Edit Allergies</Text>

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

      {/* Checklist for adding */}
      <AllergyChecklist
        existingNames={items.map((a) => a.name)}
        onAdd={handleAdd}
        onRemove={handleRemoveByName}
      />
    </ScrollView>
  );
};

export default EditAllergies;
