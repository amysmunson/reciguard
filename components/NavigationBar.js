import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import styles from '../styles/main_style';
import { TabIcon } from './icons';

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
          <TouchableOpacity key={tab.name} style={styles.navButton} onPress={() => go(tab.name)}>
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
