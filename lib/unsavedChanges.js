import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePreventRemove } from '@react-navigation/native';
import { appAlert } from './dialog';

const DISCARD_TITLE = 'Discard changes?';
const DISCARD_MESSAGE = "Your edits haven't been saved.";

// App-wide record of what has unsaved edits right now. Anything that would
// lose typing if the app remounted registers here while it's dirty — every
// useUnsavedChangesGuard screen automatically, plus in-screen modals via
// useRegisterUnsaved. lib/theme-context.js reads it to hold off a light/dark
// switch (which remounts the screens) until nothing is unsaved.
const dirtySources = new Set();
const dirtyListeners = new Set();
let nextSourceId = 1;
const emitDirty = () => {
  for (const fn of dirtyListeners) fn();
};

export const useRegisterUnsaved = (isDirty) => {
  const [id] = useState(() => nextSourceId++);
  useEffect(() => {
    if (!isDirty) return undefined;
    dirtySources.add(id);
    emitDirty();
    return () => {
      dirtySources.delete(id);
      emitDirty();
    };
  }, [id, isDirty]);
};

export const useHasUnsavedChanges = () =>
  useSyncExternalStore(
    (fn) => {
      dirtyListeners.add(fn);
      return () => dirtyListeners.delete(fn);
    },
    () => dirtySources.size > 0
  );

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
  useRegisterUnsaved(isDirty);

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
  appAlert(DISCARD_TITLE, DISCARD_MESSAGE, [
    { text: 'Keep Editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: onDiscard },
  ]);
};
