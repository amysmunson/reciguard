import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { reportNavBarOffset } from '../../lib/app/navBarOffset';

let mockOnline = false;
jest.mock('../../lib/server/connectivity', () => ({ useIsOnline: () => mockOnline }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

const MESSAGE = /You're offline/;
// The strip is the View around the message text.
const banner = () => screen.getByText(MESSAGE).parent;
const bannerStyle = () => StyleSheet.flatten(banner().props.style);

beforeEach(() => {
  mockOnline = false;
});

test('renders nothing while online', async () => {
  mockOnline = true;
  await render(<OfflineBanner />);
  expect(screen.queryByText(MESSAGE)).toBeNull();
});

test('pinned to the bottom edge, text clear of the home indicator, letting touches through', async () => {
  await render(<OfflineBanner />);
  const style = bannerStyle();
  expect(style.position).toBe('absolute');
  expect(style.bottom).toBe(0);
  // EDGE_TEXT_CLEARANCE is tunable; it just has to beat the plain 8 pt
  // padding without padding the whole 34 pt home-indicator inset on top.
  expect(style.paddingBottom).toBeGreaterThanOrEqual(8);
  expect(style.paddingBottom).toBeLessThan(8 + 34);
  expect(banner().props.pointerEvents).toBe('none');
});

test('sits right on top of the nav bar on tab screens', async () => {
  // 64 pt bar + 20 pt of screen padding under it.
  await act(() => reportNavBarOffset(84));
  await render(<OfflineBanner aboveNavBar />);
  expect(bannerStyle().bottom).toBe(84);

  // Follows the bar if it moves (e.g. larger text makes it taller).
  await act(() => reportNavBarOffset(92));
  expect(bannerStyle().bottom).toBe(92);
});
