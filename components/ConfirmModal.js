import React from 'react';
import { Modal, Pressable, Text, View, TouchableOpacity } from 'react-native';
import styles from '../styles/main_style';
import { colors } from '../styles/theme';

// Generic custom confirm dialog for unified modals
const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <Pressable style={styles.modal_backdrop} onPress={onCancel}>
      <Pressable style={styles.surface_modal} onPress={() => {}}>
        <Text style={styles.header_modal}>{title}</Text>
        {!!message && (
          <Text style={[styles.readOnly_hint, { marginBottom: 12 }]}>{message}</Text>
        )}
        <View style={styles.modal_button_right}>
          <TouchableOpacity style={styles.modal_button} onPress={onCancel}>
            <Text style={styles.modal_buttonText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modal_button} onPress={onConfirm}>
            <Text style={[styles.modal_buttonText, { color: colors.danger, fontWeight: 'bold' }]}>
              {confirmLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

export default ConfirmModal;
