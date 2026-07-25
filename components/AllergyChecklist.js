// Inline allergy picker used on EditAllergies. Checking a group or an
// individual allergen adds it immediately. Severity is set afterward

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
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

// Defined at module scope (not inside AllergyChecklist) and memoized so
// toggling one row doesn't re-render the other ~300 and cause lag. Relies on
// `onToggle` being a stable function reference (see the ref-backed
// togglePreset/toggleGroup below). Memo can't skip a re-render if the
// callback prop is a new function every time.
const PresetRow = memo(function PresetRow({ id, label, checked, onToggle }) {
  return (
    <TouchableOpacity style={styles.preset_row} onPress={() => onToggle(id)}>
      <CheckboxIcon checked={checked} />
      <Text style={[styles.preset_itemName, { flex: 1, marginLeft: 12 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const GroupRow = memo(function GroupRow({ group, checked, onToggle }) {
  return (
    <TouchableOpacity style={styles.preset_row} onPress={() => onToggle(group)}>
      <CheckboxIcon checked={checked} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.preset_groupTitle}>{group.name}</Text>
        {!!group.description && (
          <Text style={styles.preset_groupDescription}>{group.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// Props:
//   existingNames: string[] of names currently in the caller's list; drives
//                   which rows render checked.
//   onAdd(name, userCustom) / onRemove(name): fire immediately on toggle.
//                   The parent decides how to store it (e.g. friendId
//                   scoping on FriendProfile); names are lowercase-compared.
//
// A group's checked state is derived purely from existingNames — checked
// whenever every member preset is present — so it survives remounts (e.g.
// leaving and re-entering EditAllergies) the same way individual presets
// already do. There's no separate partial/half-checked state: a group
// either fully matches or it renders as a plain unchecked box, same as any
// other unselected item.
const AllergyChecklist = ({ existingNames = [], onAdd, onRemove }) => {
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

  // Rows are memoized (PresetRow/GroupRow above) so a single toggle doesn't
  // re-render the whole ~300-row list, but that only helps if the onPress
  // callback they receive is itself stable — otherwise React.memo's prop
  // comparison sees a "new" function every render and bails out anyway.
  // Reading through a ref (same pattern as onSelectionChangeRef in
  // AllergyFilterControl.js) keeps togglePreset/toggleGroup's identity fixed
  // across renders while still seeing current existingLower.
  const latestRef = useRef();
  latestRef.current = { existingLower, onAdd, onRemove };

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
  const togglePreset = useCallback((id) => {
    const { existingLower, onAdd, onRemove } = latestRef.current;
    const preset = presetById(id);
    if (!preset) return;
    if (existingLower.has(preset.name.toLowerCase())) {
      onRemove?.(preset.name);
    } else {
      onAdd?.(preset.name, false);
    }
  }, []);

  // Per-tap toggle for a group. If every member is already present, remove
  // them all; otherwise add whichever members are missing. Based on actual
  // membership so it matches whatever the checkbox is currently showing —
  // see groupState below.
  const toggleGroup = useCallback((group) => {
    const { existingLower, onAdd, onRemove } = latestRef.current;
    const memberIds = group.memberIds.filter((id) => presetById(id));
    if (!memberIds.length) return;
    const isFullySelected = memberIds.every((id) =>
      existingLower.has(presetById(id).name.toLowerCase())
    );
    memberIds.forEach((id) => {
      const name = presetById(id).name;
      if (isFullySelected) {
        onRemove?.(name);
      } else if (!existingLower.has(name.toLowerCase())) {
        onAdd?.(name, false);
      }
    });
  }, []);

  // Checked whenever every member preset is present in existingNames —
  // derived from data, so it survives remounts the same way individual
  // presets do.
  const groupState = (group) =>
    group.memberIds.every((id) => {
      const p = presetById(id);
      return p && existingLower.has(p.name.toLowerCase());
    });

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
      {visibleGroups.map((g) => (
        <GroupRow key={g.id} group={g} checked={groupState(g)} onToggle={toggleGroup} />
      ))}

      {/* Individual items */}
      {visiblePresets.length > 0 && (
        <Text style={[styles.preset_sectionLabel, { marginTop: 12 }]}>
          Common dietary needs
        </Text>
      )}
      {visiblePresets.map((p) => (
        <PresetRow
          key={p.id}
          id={p.id}
          label={cap(p.name)}
          checked={existingLower.has(p.name.toLowerCase())}
          onToggle={togglePreset}
        />
      ))}

      {!visibleGroups.length && !visiblePresets.length && (
        <Text style={styles.emptyText}>Nothing matches that filter.</Text>
      )}
    </View>
  );
};

export default AllergyChecklist;
