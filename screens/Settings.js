import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
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
      'This permanently removes your profile, recipes, folders, and dietary needs. This cannot be undone.',
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
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={[styles.rowText, danger && { color: colors.danger }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      <Text style={styles.header_tab}>Settings</Text>

      <ScrollView style={[{ flex: 1 }, styles.list_marginless]} contentContainerStyle={{ paddingBottom: 12 }}>
        <Row label="Your Profile" onPress={() => navigation.navigate('Profile')} />
        <Row label="Accessibility" onPress={() => navigation.navigate('Accessibility')} />
        <Row label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <Row label="Terms of Service" onPress={() => navigation.navigate('TermsOfService')} />
        <Row label="Send Feedback" onPress={() => navigation.navigate('Feedback')} />
        <Row label="Sign Out" onPress={handleSignOut} />
        <Row label="Delete Account" onPress={handleDeleteAccount} danger />
      </ScrollView>

      <NavigationBar navigation={navigation} onAddPress={handleAddRecipe} />
    </View>
  );
};

export default Settings;
