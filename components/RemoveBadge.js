import React from 'react';
import { TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { RemoveBadgeIcon } from './icons';

// Small red minus on the upper-right corner of an input — removes that row.
// Place it inside a wrapper View around the input (it's absolutely
// positioned). Drawn 20 pt, with hitSlop making the touch target ~40 pt so
// it's still easy to hit. Used by EditRecipe's ingredient / step / note rows
// instead of a trailing trash can.
const RemoveBadge = ({ onPress, accessibilityLabel = 'Remove' }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.removeBadge}
    hitSlop={10}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <RemoveBadgeIcon />
  </TouchableOpacity>
);

export default RemoveBadge;
