import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import styles from '../styles/main_style';
import { TabIcon } from './icons';

// Extends each tab's touch target into the otherwise-dead bar around it
// without changing layout: vertical reaches the bar's padded edges (10px,
// matching bottomNav.paddingVertical) so it doesn't poach taps from content
// above; horizontal bridges the space-around gaps so adjacent tabs' targets
// meet and a near-miss still lands on a button rather than the inert bar.
const TAB_HIT_SLOP = { top: 10, bottom: 10, left: 24, right: 24 };

// Route names match the screen names registered in the navigator; the
// per-route icon glyph is mapped in components/icons/index.js (TAB_GLYPHS).
const TABS = [
  { name: 'Home', label: 'Home' },
  { name: 'Folders', label: 'Folders' },
  { name: 'Add', label: 'Add' },
  { name: 'Friends', label: 'Friends' },
  { name: 'Settings', label: 'Settings' },
];

const NavigationBar = ({ navigation, onAddPress }) => {
  const activeRoute = useNavigationState((state) => state?.routes?.[state.index]?.name);

  const go = (name) => {
    if (name === 'Add') return onAddPress?.();
    navigation.navigate(name);
  };

  return (
    <View style={styles.bottomNav}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.navButton}
            hitSlop={TAB_HIT_SLOP}
            onPress={() => go(tab.name)}
          >
            <TabIcon
              name={tab.name}
              style={[styles.navButtonIcon, isActive && styles.navButtonIconActive]}
            />
            <Text style={[styles.navButtonText, isActive && styles.navButtonTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default NavigationBar;
