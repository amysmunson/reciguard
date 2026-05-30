import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import NavigationBar from '../components/NavigationBar';
import { useAuth } from '../lib/auth-context';
import { signOut, deleteAccount } from '../lib/api/auth';
import { startNewRecipe } from '../components/utils/addRecipe';

const Settings = ({ navigation }) => {
  const { user } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            Alert.alert('Sign out failed', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, recipes, folders, and allergies. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              Alert.alert(
                'Could not delete account',
                (err.message ?? 'Unknown error') +
                  '\n\nThis requires a `delete_current_user` Postgres function in Supabase.'
              );
            }
          },
        },
      ]
    );
  };

  const handleAddRecipe = () => {
    startNewRecipe({ navigation });
  };

  const Row = ({ label, onPress, danger }) => (
    <TouchableOpacity style={styles.settings_row} onPress={onPress}>
      <Text style={[styles.settings_rowText, danger && { color: colors.danger }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        {user?.user_metadata?.name ? (
          <Text style={styles.settings_email}>Signed in as {user.user_metadata.name}</Text>
        ) : (
          <Text style={styles.settings_email}>Signed in as {user?.email}</Text>
        )}

        <Row label="Your Profile" onPress={() => navigation.navigate('Profile')} />
        <Row label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <Row label="Sign Out" onPress={handleSignOut} />
        <Row label="Delete Account" onPress={handleDeleteAccount} danger />
      </ScrollView>

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Settings;
