import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles/main_style';

// Solid strip behind the status bar (clock, battery, Dynamic Island).
// Screens draw edge to edge, so scrolled content used to slide up under the
// status icons; this sits on top of everything at exactly the status-bar
// height (the safe-area top inset — about 47–62 pt on notch / Dynamic Island
// iPhones, 20 on older ones) so text never overlaps them. It doesn't take up
// layout space — screens aren't pushed down — and passes touches through.
// Uses the screen background color (white in light mode; dark in dark mode,
// where the status icons turn white). App.js hides it on Landing, whose photo
// is meant to run under the status bar.
const StatusBarBackdrop = () => {
  const { top } = useSafeAreaInsets();
  if (!top) return null;
  return <View pointerEvents="none" style={[styles.statusBarBackdrop, { height: top }]} />;
};

export default StatusBarBackdrop;
