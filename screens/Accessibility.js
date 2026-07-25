import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from '../components/icons';
import { colors } from '../styles/theme';
import { useAuth } from '../lib/auth-context';
import { getMyProfile, updateMyProfile } from '../lib/api/profile';
import { mutateCachedResource, useCachedResource } from '../lib/cache';

const Accessibility = ({ navigation }) => {
  const { user } = useAuth();
  const { data: profile, loading } = useCachedResource({
    resource: 'profile',
    userId: user?.id,
    fetcher: getMyProfile,
  });

  const contrast = !!profile?.contrast;

  const handleToggleContrast = useCallback(async () => {
    const nextProfile = { ...(profile ?? {}), contrast: !contrast };
    try {
      await mutateCachedResource('profile', user?.id, nextProfile);
      await updateMyProfile({ contrast: !contrast });
    } catch (err) {
      if (profile) {
        await mutateCachedResource('profile', user?.id, profile);
      }
      Alert.alert('Could not update accessibility', err.message ?? 'Unknown error');
    }
  }, [contrast, profile, user?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_safe]}
        onPress={() => navigation.goBack()}
      >
        <BackIcon style={styles.overlayIcon_lg} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.screen_policyPad}>
        <Text style={styles.header_policyMain}>Accessibility Settings</Text>

        <View style={styles.toggle_row}>
          <View style={styles.toggle_label}>
            <Text style={styles.header_section_marginless}>High-Contrast Mode</Text>
          </View>
          <Switch
            value={contrast}
            onValueChange={handleToggleContrast}
            disabled={loading}
            trackColor={{ false: colors.borderInput, true: colors.primary }}
            thumbColor={contrast ? colors.surface : colors.background}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
        <Text style={styles.policy_body}>
          Turn this mode on if you want text to be higher contrast and more visually prominent. This especially impacts the dietary restriction warnings
          within recipes, where the names of affected individuals will appear in a bold, high-contrast color with
          a highlight that reflects the severity of the dietary restriction.
        </Text>
      </ScrollView>
    </View>
  );
};

export default Accessibility;