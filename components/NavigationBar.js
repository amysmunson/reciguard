import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigationState } from '@react-navigation/native';
import styles from '../styles/main_style';

const TABS = [
  { name: 'Home', label: 'Home', icon: 'home' },
  { name: 'Folders', label: 'Folders', icon: 'folder' },
  { name: 'Add', label: 'Add', icon: 'plus-square-o' },
  { name: 'Friends', label: 'Friends', icon: 'users' },
  { name: 'Settings', label: 'Settings', icon: 'cogs' },
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
            <Icon
              name={tab.icon}
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
