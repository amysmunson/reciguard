import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles/main_style';

// A section heading with an optional small action on the right, e.g.
// "My Dietary Needs ............ Edit" on Profile / FriendProfile. The action
// uses the same look as EditHeader's Save (overlayText + bold link blue).
const SectionHeading = ({ title, actionLabel, onAction, accessibilityLabel }) => (
  <View style={styles.sectionHeading_row}>
    <Text style={[styles.header_section_marginless, { flex: 1 }]}>{title}</Text>
    {!!actionLabel && (
      <TouchableOpacity
        onPress={onAction}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? actionLabel}
      >
        <Text style={[styles.overlayText, styles.editHeader_save]}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default SectionHeading;
