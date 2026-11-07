import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon, EllipsisIcon } from './icons';
import ActionMenu from './ActionMenu';

// The standard header for every edit screen (EditRecipe, EditAllergies, and
// Profile / FriendProfile while editing): back arrow in the upper left, Save
// and the ⋯ menu in the upper right.
//
// Props:
//   onBack, onSave, saving
//   menuActions — ActionMenu actions; the ⋯ button only shows when non-empty
//   variant     — 'card' (card-style screens; top: 20) or 'safe' (EditRecipe;
//                 top: 60), matching the screen's existing overlay offsets
export const EditHeader = ({ onBack, onSave, saving = false, menuActions = [], variant = 'card' }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const safe = variant === 'safe';
  return (
    <>
      <TouchableOpacity
        style={[styles.overlay_base, safe ? styles.overlay_topLeft_safe : styles.overlay_topLeft_card]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <BackIcon style={styles.overlayIcon_md} />
      </TouchableOpacity>

      <View
        style={[
          styles.overlay_base,
          safe ? styles.overlay_topRight_safe : styles.overlay_topRight_card,
          styles.editHeader_actions,
        ]}
      >
        <TouchableOpacity onPress={onSave} disabled={saving} accessibilityRole="button">
          <Text style={[styles.overlayText, styles.editHeader_save]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
        {menuActions.length > 0 && (
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="More actions"
          >
            <EllipsisIcon size={22} />
          </TouchableOpacity>
        )}
      </View>

      {menuActions.length > 0 && (
        <ActionMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          actions={menuActions}
          anchorStyle={safe ? styles.editHeader_menuSafe : styles.editHeader_menuCard}
        />
      )}
    </>
  );
};
