import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles/main_style';
import { useIsOnline } from '../lib/server/connectivity';
import { useNavBarOffset } from '../lib/app/navBarOffset';

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

// --- Spacing you can tweak ---------------------------------------------
// Gap between the banner and the top edge of the nav bar (tab screens).
const NAV_BAR_GAP = 0;
// Screens without a nav bar: how far the banner's text sits above the very
// bottom of the screen. The home indicator line is about 13 pt tall
// including its own margin, so keep this above ~16 on Face ID iPhones.
const EDGE_TEXT_CLEARANCE = 10;
// The banner's own top padding and text size are in styles/main_style.js
// (offlineBanner, offlineBanner_text).
// ------------------------------------------------------------------------

const OfflineBanner = ({ aboveNavBar = false }) => {
  const isOnline = useIsOnline();
  const { bottom } = useSafeAreaInsets();
  const barTop = useNavBarOffset();
  if (isOnline) return null;

  const onBar = aboveNavBar && barTop > 0;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.offlineBanner,
        onBar
          ? { bottom: barTop + NAV_BAR_GAP }
          // Pinned to the bottom edge. On phones without a home indicator
          // (bottom inset 0) this is just the normal padding.
          : {
              bottom: 0,
              paddingBottom: bottom
                ? Math.max(EDGE_TEXT_CLEARANCE, styles.offlineBanner.paddingVertical)
                : styles.offlineBanner.paddingVertical,
            },
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
