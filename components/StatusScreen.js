import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { BackIcon } from './icons';

// The full-page "Loading…" / couldn't-load screen, shared so every page
// shows it the same way: same padding, the message at the same height, and
// the back arrow in the spot it has once the page loads.
//
// It's a ScrollView, like the loaded pages, so iOS insets it below the status
// bar: in a plain View the back arrow sat under the status bar, out of reach.
// Pass `refreshControl` to let the user pull down to try again.
//
// Used by RecipeCard, EditRecipe, Profile and FriendProfile.
const StatusScreen = ({
  message,
  onBack,
  refreshControl,
  backIconStyle = styles.overlayIcon_md,
  textStyle,
}) => (
  <ScrollView
    style={[styles.screen_base, styles.screen_cardPad]}
    contentContainerStyle={styles.statusScreen_container}
    refreshControl={refreshControl}
  >
    {onBack && (
      <TouchableOpacity
        style={[styles.overlay_base, styles.overlay_topLeft_card]}
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <BackIcon style={backIconStyle} />
      </TouchableOpacity>
    )}
    <Text style={[styles.emptyText, textStyle]}>{message}</Text>
  </ScrollView>
);

export default StatusScreen;
