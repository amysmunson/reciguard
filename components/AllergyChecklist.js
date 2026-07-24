// Inline allergy picker used on EditAllergies. Checking a group or an
// individual allergen adds it immediately. Severity is set afterward

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import { CheckboxIcon, SearchIcon } from './icons';
import {
  ALLERGEN_PRESETS,
  ALLERGEN_GROUPS,
  presetById,
} from '../constants/allergens';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Props:
//   existingNames: string[] of names currently in the caller's list; drives
//                   which rows render checked.
//   onAdd(name, userCustom) / onRemove(name): fire immediately on toggle.
//                   The parent decides how to store it (e.g. friendId
//                   scoping on FriendProfile); names are lowercase-compared.
//
// Group checkboxes (e.g. "All shellfish" vs. "Molluscs") are tracked by
// which group was actually tapped (selectedGroupIds), not recomputed from
// existingNames — several groups share member presets (Molluscs and
// Crustacean shellfish are both subsets of All shellfish), and deriving a
// group's checkbox from overlapping membership made picking one group
// visually check/partial-check an unrelated one.
const AllergyChecklist = ({ existingNames = [], onAdd, onRemove }) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState(() => new Set());
  const [customText, setCustomText] = useState('');
  const [query, setQuery] = useState('');

  // Convert existing names to lowercase
  const existingLower = useMemo(
    () => new Set((existingNames ?? []).map((n) => (n ?? '').toLowerCase())),
    [existingNames]
  );

  // checks if text matches the query 
  const matchesQuery = (text) =>
    !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase());

  // Filter groups based on the query
  const visibleGroups = useMemo(
    () =>
      ALLERGEN_GROUPS.filter(
        (g) => matchesQuery(g.name) || matchesQuery(g.description ?? '')
      ),
    [query]
  );

  // Filter presets based on the query
  const visiblePresets = useMemo(
    () => ALLERGEN_PRESETS.filter((p) => matchesQuery(p.name)),
    [query]
  );

  // Per-tap toggle for an individual preset. If it's already in the caller's list, remove it; otherwise add it
  const togglePreset = (id) => {
    const preset = presetById(id);
    if (!preset) return;
    if (existingLower.has(preset.name.toLowerCase())) {
      onRemove?.(preset.name);
    } else {
      onAdd?.(preset.name, false);
    }
  };

  // Per-tap toggle for a group. If the group was already selected, remove all its members; otherwise add all its members that aren't already in the caller's list
  const toggleGroup = (group) => {
    const memberIds = group.memberIds.filter((id) => presetById(id));
    if (!memberIds.length) return;
    const isSelected = selectedGroupIds.has(group.id);
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (isSelected) next.delete(group.id);
      else next.add(group.id);
      return next;
    });
    memberIds.forEach((id) => {
      const name = presetById(id).name;
      if (isSelected) {
        onRemove?.(name);
      } else if (!existingLower.has(name.toLowerCase())) {
        onAdd?.(name, false);
      }
    });
  };

  // 'none' unless this exact group was tapped. A different, overlapping
  // group being selected never changes this. 'partial' only reflects
  // this group's own members later being individually removed.
  const groupState = (group) => {
    if (!selectedGroupIds.has(group.id)) return 'none';
    const allPresent = group.memberIds.every((id) => {
      const p = presetById(id);
      return p && existingLower.has(p.name.toLowerCase());
    });
    return allPresent ? 'all-selected' : 'partial';
  };

  const handleCustomSubmit = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (existingLower.has(trimmed.toLowerCase())) {
      onRemove?.(trimmed);
    } else {
      onAdd?.(trimmed, true);
    }
    setCustomText('');
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* Filter */}
      <View style={[styles.ingredientRow, { marginBottom: 8 }]}>
        <View style={{ marginRight: 12 }}>
          <SearchIcon size={22} color={colors.textMuted} />
        </View>
        <TextInput
          style={[styles.input_base, { flex: 1 }]}
          placeholder="Filter list"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Custom "Enter your own" row at the top of the list. Added on submit or on tapping the checkbox */}
      <View style={styles.preset_row}>
        <TouchableOpacity onPress={handleCustomSubmit} style={{ marginRight: 12 }}>
          <CheckboxIcon checked={false} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input_base, { flex: 1 }]}
          placeholder="Enter your own, then hit return"
          value={customText}
          onChangeText={setCustomText}
          onSubmitEditing={handleCustomSubmit}
          autoCorrect={false}
        />
      </View>

      {/* Groups */}
      {visibleGroups.length > 0 && (
        <Text style={[styles.preset_sectionLabel, { marginTop: 12 }]}>Groups</Text>
      )}
      {visibleGroups.map((g) => {
        const state = groupState(g);
        const checked = state === 'all-selected';
        const partial = state === 'partial';
        return (
          <TouchableOpacity
            key={g.id}
            style={styles.preset_row}
            onPress={() => toggleGroup(g)}
          >
            <CheckboxIcon checked={checked} partial={partial} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.preset_groupTitle}>{g.name}</Text>
              {!!g.description && (
                <Text style={styles.preset_groupDescription}>{g.description}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Individual items */}
      {visiblePresets.length > 0 && (
        <Text style={[styles.preset_sectionLabel, { marginTop: 12 }]}>
          Common allergens
        </Text>
      )}
      {visiblePresets.map((p) => {
        const checked = existingLower.has(p.name.toLowerCase());
        return (
          <TouchableOpacity
            key={p.id}
            style={styles.preset_row}
            onPress={() => togglePreset(p.id)}
          >
            <CheckboxIcon checked={checked} />
            <Text style={[styles.preset_itemName, { flex: 1, marginLeft: 12 }]}>
              {cap(p.name)}
            </Text>
          </TouchableOpacity>
        );
      })}

      {!visibleGroups.length && !visiblePresets.length && (
        <Text style={styles.emptyText}>Nothing matches that filter.</Text>
      )}
    </View>
  );
};

export default AllergyChecklist;
