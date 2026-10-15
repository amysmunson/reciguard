import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/main_style';
import { useIsOnline } from '../lib/connectivity';

// Warning strip shown while the server can't be reached, so users know
// before they edit that changes won't save. Renders nothing while online.
const OfflineBanner = ({ style }) => {
  const isOnline = useIsOnline();
  if (isOnline) return null;
  return (
    <View
      style={[styles.offlineBanner, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.offlineBanner_text}>
        You&apos;re offline. Changes can&apos;t be saved until you reconnect.
      </Text>
    </View>
  );
};

export default OfflineBanner;
