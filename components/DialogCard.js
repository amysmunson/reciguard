import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';

// The one dialog look used everywhere: ConfirmModal and every appAlert().
// Title, optional message, and a right-aligned button row. Button styles:
//   cancel      — plain
//   destructive — bold, danger red
//   default     — bold, link blue
export const dialogButtonTextStyle = (style) => {
  if (style === 'cancel') return styles.modal_buttonText;
  return [
    styles.modal_buttonText,
    { color: style === 'destructive' ? colors.danger : colors.link, fontWeight: 'bold' },
  ];
};

const DialogCard = ({ title, message, buttons, onPressButton }) => (
  <Pressable style={styles.surface_modal} onPress={() => {}} accessibilityRole="alert">
    <Text style={styles.header_modal}>{title}</Text>
    {!!message && <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>{message}</Text>}
    <View style={styles.modal_button_right}>
      {buttons.map((b, i) => (
        <TouchableOpacity
          key={`${b.text}-${i}`}
          style={styles.modal_button}
          onPress={() => onPressButton(b)}
          accessibilityRole="button"
        >
          <Text style={dialogButtonTextStyle(b.style)}>{b.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </Pressable>
);

export default DialogCard;
