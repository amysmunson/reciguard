import React, { useEffect, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import styles from '../styles/main_style';
import DialogCard from './DialogCard';
import {
  allocateDialogHostId,
  dismissDialog,
  registerDialogHost,
  resolveDialog,
  useDialogState,
} from '../lib/dialog';

// iOS can't present a modal while another is still animating closed, so a
// host that just became the top one (e.g. the folder picker closed and an
// "Added" dialog fired in the same tap) waits out the rest of this window
// before showing.
const AFTER_MODAL_CLOSE_MS = 400;

// Draws the current appAlert() dialog when it's the topmost host (see
// lib/dialog.js). One sits at the app root; AppModal adds one inside each
// in-app modal.
const DialogHost = () => {
  const [hostId] = useState(allocateDialogHostId);
  const { dialog, topHost, topChangedAt } = useDialogState();
  // The topChangedAt we've finished waiting out (see AFTER_MODAL_CLOSE_MS).
  const [readyFor, setReadyFor] = useState(null);
  const isTop = topHost === hostId;

  useEffect(() => registerDialogHost(hostId), [hostId]);

  useEffect(() => {
    if (!isTop || !dialog) return undefined;
    const wait = Math.max(0, topChangedAt + AFTER_MODAL_CLOSE_MS - Date.now());
    const t = setTimeout(() => setReadyFor(topChangedAt), wait);
    return () => clearTimeout(t);
  }, [isTop, dialog, topChangedAt]);

  if (!isTop || !dialog || readyFor !== topChangedAt) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => dismissDialog(dialog)}>
      <Pressable style={styles.modal_backdrop} onPress={() => dismissDialog(dialog)}>
        <DialogCard
          title={dialog.title}
          message={dialog.message}
          buttons={dialog.buttons}
          onPressButton={resolveDialog}
        />
      </Pressable>
    </Modal>
  );
};

export default DialogHost;
