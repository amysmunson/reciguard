import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';

const DISCARD_TITLE = 'Discard changes?';
const DISCARD_MESSAGE = "Your edits haven't been saved.";

// Guards a screen against being left with unsaved edits. Catches every way
// a stack screen can be removed — the in-screen back button, the iOS swipe
// gesture, Android hardware back, and nav-bar jumps that pop the stack —
// and asks before discarding.
//
// Returns:
//   discardModalProps — spread onto <ConfirmModal /> to render the prompt.
//   leaveWithoutPrompt(fn) — run a navigation call that should skip the
//     prompt, e.g. after a successful save or delete (isDirty is still true
//     until the next render, so the guard would otherwise fire).
export const useUnsavedChangesGuard = ({ navigation, isDirty }) => {
  const [pendingAction, setPendingAction] = useState(null);
  const skipRef = useRef(false);

  usePreventRemove(isDirty, ({ data }) => {
    if (skipRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    setPendingAction(data.action);
  });

  const leaveWithoutPrompt = useCallback((fn) => {
    skipRef.current = true;
    fn();
  }, []);

  const discardModalProps = {
    visible: !!pendingAction,
    title: DISCARD_TITLE,
    message: DISCARD_MESSAGE,
    confirmLabel: 'Discard',
    cancelLabel: 'Keep Editing',
    onConfirm: () => {
      const action = pendingAction;
      setPendingAction(null);
      skipRef.current = true;
      navigation.dispatch(action);
    },
    onCancel: () => setPendingAction(null),
  };

  return { discardModalProps, leaveWithoutPrompt };
};

// In-screen modals (new folder, rename, add-to-folder, ...) aren't stack
// screens, so they're guarded by hand: call this from the backdrop tap /
// Android back handler. Discards straight away when there's nothing to lose.
export const confirmDiscard = (isDirty, onDiscard) => {
  if (!isDirty) {
    onDiscard();
    return;
  }
  Alert.alert(DISCARD_TITLE, DISCARD_MESSAGE, [
    { text: 'Keep Editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: onDiscard },
  ]);
};
