import { useSyncExternalStore } from 'react';

// How far the NavigationBar's top edge is from the bottom of the screen, so
// the offline banner (components/OfflineBanner.js) can sit right on top of
// it. Reported by NavigationBar after layout; it includes any padding the
// screen puts under the bar (screen_tabPad's paddingBottom), not just the
// bar's height. Every tab screen renders the same bar, so one value covers
// them all.
//
// Kept in its own file rather than in OfflineBanner.js: Fast Refresh re-runs
// a file when you save it, which would reset this to 0, and the bar doesn't
// re-report because it hasn't moved. The banner would then drop onto the bar.

let navBarTop = 0;
const listeners = new Set();

export const reportNavBarOffset = (offsetFromBottom) => {
  if (offsetFromBottom === navBarTop) return;
  navBarTop = offsetFromBottom;
  for (const fn of listeners) fn();
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useNavBarOffset = () => useSyncExternalStore(subscribe, () => navBarTop);
