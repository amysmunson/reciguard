import React from 'react';
import { Text, TouchableOpacity, Modal, Pressable, View } from 'react-native';
import styles from '../styles/main_style';
import { RadioIcon, SortArrowIcon } from './icons';

// Pop-down sort menu shared by Home, Folders, and FolderDetail.
// Renders a radio list of `options` plus a direction toggle (asc/desc) that
// applies to whichever option is selected.
//
// Props:
//   visible        — whether the menu is shown
//   onClose        — called on backdrop tap
//   options        — [{ id, label }]
//   sort           — { by, dir }
//   onChange       — (next: { by, dir }) => void
//   popdownStyle   — optional style override for the menu position
const SortMenu = ({ visible, onClose, options, sort, onChange, popdownStyle }) => {
  const { by, dir } = sort;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sort_popdown_backdrop} onPress={onClose}>
        <Pressable style={[styles.sort_popdown, popdownStyle]} onPress={() => {}}>
          {options.map((opt) => {
            const selected = by === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={styles.sort_popdown_row}
                onPress={() => onChange({ by: opt.id, dir })}
              >
                <RadioIcon selected={selected} />
                <Text style={styles.sort_popdown_rowText}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.sort_popdown_divider} />

          <TouchableOpacity
            style={styles.sort_popdown_row}
            onPress={() => onChange({ by, dir: dir === 'asc' ? 'desc' : 'asc' })}
          >
            <SortArrowIcon direction={dir} />
            <Text style={styles.sort_popdown_rowText}>
              {dir === 'asc' ? 'Ascending' : 'Descending'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default SortMenu;
