import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ReorderableList from '../../components/ReorderableList';
import { EditHeader } from '../../components/EditHeader';

test('ReorderableList moves rows with the accessibility Move up / Move down actions', async () => {
  const onReorder = jest.fn();
  const items = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
  await render(
    <ReorderableList
      items={items}
      onReorder={onReorder}
      renderItem={({ item, dragHandleProps }) => (
        <Text {...dragHandleProps} testID={`handle-${item.key}`}>
          {item.key}
        </Text>
      )}
    />
  );
  await fireEvent(screen.getByTestId('handle-a'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(onReorder).toHaveBeenLastCalledWith([{ key: 'b' }, { key: 'a' }, { key: 'c' }]);
  await fireEvent(screen.getByTestId('handle-c'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
  expect(onReorder).toHaveBeenLastCalledWith([{ key: 'a' }, { key: 'c' }, { key: 'b' }]);
});

test('EditHeader: back, Save, and ⋯ only when there are menu actions', async () => {
  const onBack = jest.fn();
  const onSave = jest.fn();
  const { rerender } = await render(<EditHeader onBack={onBack} onSave={onSave} />);
  await fireEvent.press(screen.getByLabelText('Back'));
  await fireEvent.press(screen.getByText('Save'));
  expect(onBack).toHaveBeenCalled();
  expect(onSave).toHaveBeenCalled();
  expect(screen.queryByLabelText('More actions')).toBeNull();

  await rerender(
    <EditHeader onBack={onBack} onSave={onSave} menuActions={[{ key: 'x', label: 'Delete', onPress: jest.fn() }]} />
  );
  expect(screen.getByLabelText('More actions')).toBeTruthy();
});
