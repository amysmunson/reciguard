import React, { useSyncExternalStore } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles/main_style';
import { useIsOnline } from '../lib/server/connectivity';

// Warning strip shown while the server can't be reached, so users know
// before they edit that changes won't save. Renders nothing while online.
//
// Mounted in exactly two places, so no screen or popup has to add it:
//   - App.js, over the whole navigator (every screen)
//   - AppModal, inside every popup (a native modal covers the root one)
// It floats over the bottom of the screen without taking layout space, and
// passes touches through so the content under it still scrolls. On tab
// screens it sits right on top of the NavigationBar; elsewhere it's pinned
// to the bottom edge.

// NavigationBar's measured height, reported from its onLayout. Every tab
// screen renders the same bar, so one value covers them all.
let navBarHeight = 0;
const listeners = new Set();
export const reportNavBarHeight = (height) => {
  if (height === navBarHeight) return;
  navBarHeight = height;
  for (const fn of listeners) fn();
};
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const useNavBarHeight = () => useSyncExternalStore(subscribe, () => navBarHeight);

const OfflineBanner = ({ aboveNavBar = false }) => {
  const isOnline = useIsOnline();
  const { bottom } = useSafeAreaInsets();
  const barHeight = useNavBarHeight();
  if (isOnline) return null;

  const onBar = aboveNavBar && barHeight > 0;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.offlineBanner,
        onBar
          ? { bottom: barHeight }
          // Pinned to the bottom edge: pad past the home indicator.
          : { bottom: 0, paddingBottom: styles.offlineBanner.paddingVertical + bottom },
      ]}
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
