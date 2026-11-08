import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import OfflineBanner, { reportNavBarHeight } from '../../components/OfflineBanner';

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

test('pinned to the bottom edge, padded past the home indicator, letting touches through', async () => {
  await render(<OfflineBanner />);
  const style = bannerStyle();
  expect(style.position).toBe('absolute');
  expect(style.bottom).toBe(0);
  expect(style.paddingBottom).toBe(8 + 34);
  expect(banner().props.pointerEvents).toBe('none');
});

test('sits right on top of the nav bar on tab screens', async () => {
  await act(() => reportNavBarHeight(64));
  await render(<OfflineBanner aboveNavBar />);
  expect(bannerStyle().bottom).toBe(64);

  // Follows the bar if its height changes (e.g. larger text).
  await act(() => reportNavBarHeight(72));
  expect(bannerStyle().bottom).toBe(72);
});
