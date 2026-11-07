import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';
import NavigationBar from '../components/NavigationBar';
import { signOut, deleteAccount } from '../lib/api/auth';
import { useAuth } from '../lib/auth-context';
import { loadJson, saveJson, KEYS } from '../lib/storage';
import { THEME_PREFERENCES, useTheme } from '../lib/theme-context';
import { useCachingEnabled } from '../lib/cachePreference';
import { useContrastSetting } from '../lib/useContrastSetting';
import { applyCachingPreference } from '../lib/cache';
import { alertSaveFailed } from '../lib/connectivity';
import { appAlert } from '../lib/dialog';

const Row = ({ label, onPress, danger }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <Text style={[styles.rowText, danger && { color: colors.danger }]}>{label}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ label }) => (
  <View style={styles.settings_sectionHeader}>
    <Text style={styles.settings_sectionHeaderText}>{label}</Text>
  </View>
);

const Settings = ({ navigation }) => {
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  // Same setting as the Accessibility screen (lib/useContrastSetting.js).
  const { contrast, loading: contrastLoading, toggleContrast } = useContrastSetting();

  // Hide vs warn for recipes that conflict with the active dietary filter.
  const [hideUnsafe, setHideUnsafe] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const saved = await loadJson(KEYS.hideUnsafeRecipes(user.id), false);
      if (!cancelled) setHideUnsafe(!!saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Data → keep copies on this device (lib/cachePreference.js). Off clears
  // the stored copies immediately.
  const cachingEnabled = useCachingEnabled();
  const handleToggleCaching = async (next) => {
    try {
      await applyCachingPreference(next, user?.id);
    } catch (err) {
      alertSaveFailed(err, 'Could not change this setting');
    }
  };

  const handleToggleHideUnsafe = (next) => {
    setHideUnsafe(next);
    if (user?.id) saveJson(KEYS.hideUnsafeRecipes(user.id), next);
  };

  const handleSignOut = () => {
    appAlert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            appAlert('Sign out failed', err.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    appAlert(
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
              appAlert(
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

  return (
    <View style={[styles.screen_base, styles.screen_tabPad]}>
      <Text style={styles.header_tab}>Settings</Text>

      <ScrollView style={[{ flex: 1 }, styles.list_marginless]} contentContainerStyle={{ paddingBottom: 12 }}>
        <SectionHeader label="Social" />
        <Row label="Sharing With" onPress={() => navigation.navigate('SharingWith')} />
        <Row label="Blocked" onPress={() => navigation.navigate('BlockedUsers')} />

        <SectionHeader label="Display" />
        <View style={styles.row}>
          <Text style={styles.rowText}>Appearance</Text>
          <View style={styles.segmented_row} accessibilityRole="radiogroup">
            {THEME_PREFERENCES.map((opt) => {
              const selected = preference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  style={[styles.segmented_option, selected && styles.segmented_optionSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.segmented_optionText,
                      selected && styles.segmented_optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.rowText}>High-contrast mode</Text>
            <Text style={styles.settings_rowHint}>
              Makes text, and the names in dietary warnings, bolder and higher contrast. Also in
              Accessibility.
            </Text>
          </View>
          <Switch
            value={contrast}
            onValueChange={toggleContrast}
            disabled={contrastLoading}
            trackColor={{ false: colors.borderInput, true: colors.primary }}
            accessibilityLabel="High-contrast mode"
          />
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.rowText}>Hide recipes with dietary conflicts</Text>
            <Text style={styles.settings_rowHint}>
              {hideUnsafe
                ? 'Recipes that match the dietary filter are hidden from Home and folders.'
                : 'Recipes that match the dietary filter are shown with warning dots.'}
            </Text>
          </View>
          <Switch
            value={hideUnsafe}
            onValueChange={handleToggleHideUnsafe}
            trackColor={{ false: colors.borderInput, true: colors.primary }}
            accessibilityLabel="Hide recipes with dietary conflicts"
          />
        </View>

        <SectionHeader label="Data" />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.rowText}>Keep copies on this device</Text>
            <Text style={styles.settings_rowHint}>
              {cachingEnabled
                ? 'Recipes and lists load instantly, and your recently opened recipes work offline.'
                : 'Nothing is saved on this device. Everything loads from the server, so recipes can’t be opened offline.'}
            </Text>
          </View>
          <Switch
            value={cachingEnabled}
            onValueChange={handleToggleCaching}
            trackColor={{ false: colors.borderInput, true: colors.primary }}
            accessibilityLabel="Keep copies on this device"
          />
        </View>

        <SectionHeader label="Settings" />
        <Row label="Accessibility" onPress={() => navigation.navigate('Accessibility')} />
        <Row label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <Row label="Terms of Service" onPress={() => navigation.navigate('TermsOfService')} />
        <Row label="Send Feedback" onPress={() => navigation.navigate('Feedback')} />

        <SectionHeader label="Account" />
        <Row label="Your Profile" onPress={() => navigation.navigate('Profile')} />
        <Row label="Sign Out" onPress={handleSignOut} />
        <Row label="Delete Account" onPress={handleDeleteAccount} danger />
      </ScrollView>

      <NavigationBar navigation={navigation} />
    </View>
  );
};

export default Settings;
