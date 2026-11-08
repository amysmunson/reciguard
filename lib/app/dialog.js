import { useSyncExternalStore } from 'react';

// App-wide dialogs, drawn with the same card as ConfirmModal ("Discard
// changes?") instead of the native Alert, so every alert looks the same.
//
//   appAlert(title, message?, buttons?)
//
// takes the same arguments as React Native's Alert.alert: buttons are
// { text, style?: 'cancel' | 'destructive' | 'default', onPress? } and
// default to a single "OK". Dialogs queue, so one opened from another's
// button shows next.
//
// Where a dialog appears: every <DialogHost> registers here, and the most
// recently mounted one draws it. App.js mounts one at the root, and
// AppModal mounts one inside each in-app modal — on iOS a modal can only be
// presented from the topmost one, so a dialog raised while (say) the folder
// picker is open has to render inside that modal to show at all.

let queue = [];
let hosts = []; // host ids, most recent last
let topChangedAt = 0;
let nextHostId = 1;
let snapshot = { dialog: null, topHost: null, topChangedAt: 0 };
const listeners = new Set();

const emit = () => {
  snapshot = { dialog: queue[0] ?? null, topHost: hosts[hosts.length - 1] ?? null, topChangedAt };
  for (const fn of listeners) fn();
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useDialogState = () => useSyncExternalStore(subscribe, () => snapshot);

export const allocateDialogHostId = () => nextHostId++;

// Call after mount; returns the unregister function.
export const registerDialogHost = (id) => {
  hosts = [...hosts, id];
  topChangedAt = Date.now();
  emit();
  return () => {
    const wasTop = hosts[hosts.length - 1] === id;
    hosts = hosts.filter((h) => h !== id);
    if (wasTop) topChangedAt = Date.now();
    emit();
  };
};

export const appAlert = (title, message, buttons) => {
  queue = [
    ...queue,
    {
      title: title ?? '',
      message: message ?? '',
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    },
  ];
  emit();
};

// Closes the current dialog, then runs the chosen button's handler (which
// may open the next dialog).
export const resolveDialog = (button) => {
  queue = queue.slice(1);
  emit();
  button?.onPress?.();
};

// Backdrop tap / Android back: acts as the cancel button if there is one, or
// the only button of a one-button dialog; otherwise does nothing (a choice
// has to be made).
export const dismissDialog = (dialog) => {
  const cancel = dialog.buttons.find((b) => b.style === 'cancel');
  if (cancel) resolveDialog(cancel);
  else if (dialog.buttons.length === 1) resolveDialog(dialog.buttons[0]);
};
