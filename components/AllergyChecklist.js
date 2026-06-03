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
import { severityColor, severityLabel } from '../lib/api/allergies';

const SEVERITY_OPTIONS = ['mild', 'moderate', 'severe'];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Inline allergy-add UI used on Profile and FriendProfile in edit mode.
// The user picks from groups + individual common allergens via checkboxes,
// or writes their own in the "Enter your own" row at the top. A single
// severity selection applies to every item added in the batch.
//
// Props:
//   existingNames — string[] of names already present; matching presets
//                   render disabled with "Added" so duplicates can't be created.
//   onConfirm({ items: [{ name, userCustom }], severity })
//                 — fires when the user hits Add. Names are lowercased.
//                   The parent is responsible for calling addAllergy() for
//                   each item with whatever scoping the screen needs
//                   (e.g. friendId on FriendProfile).
const AllergyChecklist = ({ existingNames = [], onConfirm }) => {
  const [selectedPresetIds, setSelectedPresetIds] = useState(() => new Set());
  const [customChecked, setCustomChecked] = useState(false);
  const [customText, setCustomText] = useState('');
  const [severity, setSeverity] = useState(null);
  const [query, setQuery] = useState('');

  const existingLower = useMemo(
    () => new Set((existingNames ?? []).map((n) => (n ?? '').toLowerCase())),
    [existingNames]
  );

  const matchesQuery = (text) =>
    !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase());

  const visibleGroups = useMemo(
    () =>
      ALLERGEN_GROUPS.filter(
        (g) => matchesQuery(g.name) || matchesQuery(g.description ?? '')
      ),
    [query]
  );

  const visiblePresets = useMemo(
    () => ALLERGEN_PRESETS.filter((p) => matchesQuery(p.name)),
    [query]
  );

  const isPresetDisabled = (preset) =>
    existingLower.has(preset.name.toLowerCase());

  const togglePreset = (id) => {
    const preset = presetById(id);
    if (!preset || isPresetDisabled(preset)) return;
    setSelectedPresetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (group) => {
    const eligible = group.memberIds.filter((id) => {
      const p = presetById(id);
      return p && !existingLower.has(p.name.toLowerCase());
    });
    if (!eligible.length) return;
    const allSelected = eligible.every((id) => selectedPresetIds.has(id));
    setSelectedPresetIds((prev) => {
      const next = new Set(prev);
      if (allSelected) eligible.forEach((id) => next.delete(id));
      else eligible.forEach((id) => next.add(id));
      return next;
    });
  };

  const groupState = (group) => {
    const eligible = group.memberIds.filter((id) => {
      const p = presetById(id);
      return p && !existingLower.has(p.name.toLowerCase());
    });
    if (!eligible.length) return 'all-existing';
    if (eligible.every((id) => selectedPresetIds.has(id))) return 'all-selected';
    if (eligible.some((id) => selectedPresetIds.has(id))) return 'partial';
    return 'none';
  };

  const customName = customText.trim().toLowerCase();
  const customValid =
    customChecked && customName.length > 0 && !existingLower.has(customName);
  const totalCount = selectedPresetIds.size + (customValid ? 1 : 0);

  const handleAdd = () => {
    if (!totalCount) return;
    const items = Array.from(selectedPresetIds)
      .map((id) => presetById(id)?.name)
      .filter(Boolean)
      .map((name) => ({ name, userCustom: false }));
    if (customValid) items.push({ name: customName, userCustom: true });

    onConfirm?.({ items, severity });

    setSelectedPresetIds(new Set());
    setCustomChecked(false);
    setCustomText('');
    setSeverity(null);
    setQuery('');
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* Filter */}
      <View style={[styles.ingredientRow, { marginBottom: 8 }]}>
        <View style={{ marginRight: 6 }}>
          <SearchIcon size={16} color={colors.textMuted} />
        </View>
        <TextInput
          style={styles.input_base}
          placeholder="Filter list"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Custom "Enter your own" row at the top of the list */}
      <View style={styles.preset_row}>
        <TouchableOpacity
          onPress={() => setCustomChecked((v) => !v)}
          style={{ marginRight: 12 }}
        >
          <CheckboxIcon checked={customChecked} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input_base, { flex: 1 }]}
          placeholder="Enter your own"
          value={customText}
          onChangeText={(t) => {
            setCustomText(t);
            // Auto-check when user types so it's not surprising on confirm
            if (t.trim() && !customChecked) setCustomChecked(true);
          }}
          autoCorrect={false}
        />
      </View>

      {/* Groups */}
      {visibleGroups.length > 0 && (
        <Text style={[styles.preset_sectionLabel, { marginTop: 12 }]}>Groups</Text>
      )}
      {visibleGroups.map((g) => {
        const state = groupState(g);
        const disabled = state === 'all-existing';
        const checked = state === 'all-selected';
        const partial = state === 'partial';
        return (
          <TouchableOpacity
            key={g.id}
            style={[styles.preset_row, disabled && { opacity: 0.5 }]}
            onPress={() => toggleGroup(g)}
            disabled={disabled}
          >
            <CheckboxIcon checked={checked} partial={partial} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.preset_groupTitle}>{g.name}</Text>
              {!!g.description && (
                <Text style={styles.preset_groupDescription}>{g.description}</Text>
              )}
              {disabled && (
                <Text style={styles.preset_addedHint}>All already added</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Individuals */}
      {visiblePresets.length > 0 && (
        <Text style={[styles.preset_sectionLabel, { marginTop: 12 }]}>
          Common allergens
        </Text>
      )}
      {visiblePresets.map((p) => {
        const disabled = isPresetDisabled(p);
        const checked = selectedPresetIds.has(p.id);
        return (
          <TouchableOpacity
            key={p.id}
            style={[styles.preset_row, disabled && { opacity: 0.5 }]}
            onPress={() => togglePreset(p.id)}
            disabled={disabled}
          >
            <CheckboxIcon checked={checked} />
            <Text style={[styles.preset_itemName, { flex: 1, marginLeft: 12 }]}>
              {cap(p.name)}
            </Text>
            {disabled && <Text style={styles.preset_addedHint}>Added</Text>}
          </TouchableOpacity>
        );
      })}

      {!visibleGroups.length && !visiblePresets.length && (
        <Text style={styles.emptyText}>Nothing matches that filter.</Text>
      )}

      {/* Severity for this batch */}
      <View style={[styles.severityPicker, { marginTop: 16 }]}>
        {SEVERITY_OPTIONS.map((opt) => {
          const selected = severity === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.severityPickerChip,
                selected && {
                  backgroundColor: severityColor(opt),
                  borderColor: severityColor(opt),
                },
              ]}
              onPress={() => setSeverity(selected ? null : opt)}
            >
              <Text
                style={[
                  styles.severityPickerLabel,
                  selected && { color: colors.textOnPrimary, fontWeight: 'bold' },
                ]}
              >
                {severityLabel(opt)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: totalCount ? colors.link : colors.border,
            padding: 14,
            marginTop: 12,
          },
        ]}
        onPress={handleAdd}
        disabled={!totalCount}
      >
        <Text style={[styles.addButtonText, { color: colors.textOnPrimary, fontWeight: 'bold' }]}>
          {totalCount ? `Add ${totalCount}` : 'Add'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AllergyChecklist;
