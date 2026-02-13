import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import styles from './styles/main_style';

const BottomNav = ({ navigation, userId, onAddPress }) => {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home', { userId })}>
        <Icon name="home" style={styles.navButtonIcon} />
        <Text style={styles.navButtonText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home', { userId })}>
        <Icon name="folder" style={styles.navButtonIcon} />
        <Text style={styles.navButtonText}>Folders</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onAddPress}>
        <Icon name="plus-square-o" style={styles.navButtonIcon} />
        <Text style={styles.navButtonText}>Add</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home', { userId })}>
        <Icon name="users" style={styles.navButtonIcon} />
        <Text style={styles.navButtonText}>Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings', { userId })}>
        <Icon name="cogs" style={styles.navButtonIcon} />
        <Text style={styles.navButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNav;