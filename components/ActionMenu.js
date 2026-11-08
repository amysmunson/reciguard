import React from 'react';
import { Pressable, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import AppModal from './AppModal';

// ... Action Menu in upper right corner
// `actions` is a list of { key, label, icon?: ReactNode, onPress, danger?: boolean }
// and `anchorStyle` positions the card (e.g. styles.recipeMenu_card).
// The menu closes before running the chosen action.
const ActionMenu = ({ visible, onClose, actions, anchorStyle }) => (
  <AppModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.sort_popdown_backdrop} onPress={onClose}>
      <Pressable style={[styles.sort_popdown, anchorStyle]} onPress={() => {}}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={styles.sort_popdown_row}
            onPress={() => {
              onClose();
              a.onPress();
            }}
          >
            {a.icon}
            <Text style={[styles.sort_popdown_rowText, a.danger && { color: colors.danger }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Pressable>
    </Pressable>
  </AppModal>
);

export default ActionMenu;
