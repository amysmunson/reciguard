import React from 'react';
import { Pressable } from 'react-native';
import styles from '../styles/main_style';
import AppModal from './AppModal';
import DialogCard from './DialogCard';

// Declarative confirm dialog (e.g. "Discard changes?"), for screens that
// keep the open/closed state themselves. Same card as appAlert() in
// lib/dialog.js — use that for one-off alerts and confirms.
// confirmStyle: 'destructive' (default, red) or 'default' (blue).
const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmStyle = 'destructive',
  onConfirm,
  onCancel,
}) => (
  <AppModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <Pressable style={styles.modal_backdrop} onPress={onCancel}>
      <DialogCard
        title={title}
        message={message}
        buttons={[
          { text: cancelLabel, style: 'cancel', onPress: onCancel },
          { text: confirmLabel, style: confirmStyle, onPress: onConfirm },
        ]}
        onPressButton={(b) => b.onPress?.()}
      />
    </Pressable>
  </AppModal>
);

export default ConfirmModal;
