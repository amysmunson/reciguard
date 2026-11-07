import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import styles from '../styles/main_style';
import { TabIcon } from './icons';
import OfflineBanner from './OfflineBanner';

// Extends each tab's touch target into the otherwise-dead bar around it
// without changing layout: vertical reaches the bar's padded edges (10px,
// matching bottomNav.paddingVertical) so it doesn't poach taps from content
// above; horizontal bridges the space-around gaps so adjacent tabs' targets
// meet and a near-miss still lands on a button rather than the inert bar.
const TAB_HIT_SLOP = { top: 10, bottom: 10, left: 24, right: 24 };

// Tab names match the screen names registered in the navigator, except Add,
// which opens InputSelector (`route`) to start a new recipe. Nothing is saved
// until Save in EditRecipe. The per-tab icon glyph is mapped in
// components/icons/index.js (TAB_GLYPHS).
const TABS = [
  { name: 'Home', label: 'Home' },
  { name: 'Folders', label: 'Folders' },
  { name: 'Add', label: 'Add', route: 'InputSelector' },
  { name: 'Friends', label: 'Friends' },
  { name: 'Settings', label: 'Settings' },
];

const NavigationBar = ({ navigation, onHomePress }) => {
  const activeRoute = useNavigationState((state) => state?.routes?.[state.index]?.name);

  const go = (tab) => {
    if (tab.name === 'Home') onHomePress?.();
    navigation.navigate(tab.route ?? tab.name);
  };

  // The offline banner sits just above the bar so every tab screen gets it.
  return (
    <>
      <OfflineBanner />
      <View style={styles.bottomNav}>
        {TABS.map((tab) => {
          const isActive = activeRoute === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navButton}
              hitSlop={TAB_HIT_SLOP}
              onPress={() => go(tab)}
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
    </>
  );
};

export default NavigationBar;
