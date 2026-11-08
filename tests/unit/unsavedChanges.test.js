import { renderHook, act } from '@testing-library/react-native';
import { useRegisterUnsaved, useHasUnsavedChanges, confirmDiscard } from '../../lib/app/unsavedChanges';
import * as dialog from '../../lib/app/dialog';

test('the app-wide unsaved registry reflects every dirty source', async () => {
  const tracker = await renderHook(() => useHasUnsavedChanges());
  expect(tracker.result.current).toBe(false);

  const a = await renderHook(({ dirty }) => useRegisterUnsaved(dirty), { initialProps: { dirty: true } });
  const b = await renderHook(({ dirty }) => useRegisterUnsaved(dirty), { initialProps: { dirty: true } });
  expect(tracker.result.current).toBe(true);

  await a.rerender({ dirty: false });
  expect(tracker.result.current).toBe(true); // b still dirty
  await b.unmount();
  expect(tracker.result.current).toBe(false);
});

test('confirmDiscard discards immediately when clean, asks when dirty', async () => {
  const spy = jest.spyOn(dialog, 'appAlert').mockImplementation(() => {});
  const discard = jest.fn();
  confirmDiscard(false, discard);
  expect(discard).toHaveBeenCalledTimes(1);
  expect(spy).not.toHaveBeenCalled();

  confirmDiscard(true, discard);
  expect(spy).toHaveBeenCalledWith('Discard changes?', expect.any(String), expect.any(Array));
  const discardButton = spy.mock.calls[0][2].find((b) => b.text === 'Discard');
  await act(async () => discardButton.onPress());
  expect(discard).toHaveBeenCalledTimes(2);
  spy.mockRestore();
});
