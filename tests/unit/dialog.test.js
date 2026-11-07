import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { appAlert } from '../../lib/dialog';
import DialogHost from '../../components/DialogHost';

jest.useFakeTimers();

const showHost = async () => {
  await render(<DialogHost />);
  await act(async () => jest.advanceTimersByTime(500)); // past the after-modal-close wait
};
const flush = () => act(async () => jest.advanceTimersByTime(10));

test('appAlert renders the shared card and runs the pressed button', async () => {
  await showHost();
  const onDelete = jest.fn();
  await act(async () =>
    appAlert('Delete recipe?', 'It stays in Recently Deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ])
  );
  await flush();
  expect(screen.getByText('Delete recipe?')).toBeTruthy();
  expect(screen.getByText('It stays in Recently Deleted.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Delete'));
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Delete recipe?')).toBeNull();
});

test('dialogs queue: one opened from a button shows next; default button is OK', async () => {
  await showHost();
  await act(async () => appAlert('First', '', [{ text: 'Next', onPress: () => appAlert('Second') }]));
  await flush();
  await fireEvent.press(screen.getByText('Next'));
  await flush();
  expect(screen.getByText('Second')).toBeTruthy();
  await fireEvent.press(screen.getByText('OK'));
  expect(screen.queryByText('Second')).toBeNull();
});
