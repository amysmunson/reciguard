import React, { useState } from 'react';
import { Animated, Keyboard, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import styles from '../styles/main_style';

// Drag-and-drop reordering for EditRecipe's ingredient / step lists.
//
// Each row gets `dragHandleProps` to spread onto its handle (≡). Pressing the
// handle picks the row up; it follows the finger, the rows it passes shift
// out of the way, and releasing drops it there (onReorder gets the new
// array). Built on the plain RN responder system — no gesture library — so
// rows can be any height (multiline inputs) and inputs keep focus/state
// (rows are keyed by item.key).
//
// Props:
//   items               array of objects with a stable, unique `key`
//   renderItem          ({ item, index, isDragging, dragHandleProps }) => node
//   onReorder           (nextItems) => void
//   onDragActiveChange  (active: boolean) => void — the parent should disable
//                       its ScrollView while a drag is active
//
// Screen readers: the handle is "adjustable" with Move up / Move down
// actions, so reordering doesn't depend on dragging.
// Non-render bookkeeping for one list: row positions ({ y, height } by key,
// height including the row's bottom margin, kept current by onLayout) and the
// live drag ({ from, to, startY }). Plain closures rather than refs, since the
// responder callbacks are created during render.
const createDragStore = () => {
  const layouts = {};
  let drag = null;
  return {
    setLayout: (key, layout) => {
      layouts[key] = layout;
    },
    layoutOf: (key) => layouts[key],
    begin: (d) => {
      drag = d;
    },
    active: () => drag,
    finish: () => {
      const d = drag;
      drag = null;
      return d;
    },
  };
};

const ReorderableList = ({ items, renderItem, onReorder, onDragActiveChange }) => {
  const [store] = useState(createDragStore);
  const [translateY] = useState(() => new Animated.Value(0));
  // What the render needs: which row is lifted and where it would land.
  const [dragState, setDragState] = useState(null); // { key, from, to, height }

  const move = (from, to) => {
    if (to < 0 || to >= items.length || to === from) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  // Index the dragged row would drop at: past every neighbour whose midpoint
  // its own midpoint has crossed.
  const targetIndex = (from, dy) => {
    const own = store.layoutOf(items[from].key);
    if (!own) return from;
    const center = own.y + own.height / 2 + dy;
    const mid = (i) => {
      const l = store.layoutOf(items[i].key);
      return l ? l.y + l.height / 2 : null;
    };
    let to = from;
    for (let i = from + 1; i < items.length && mid(i) !== null && center > mid(i); i++) to = i;
    if (to === from) {
      for (let i = from - 1; i >= 0 && mid(i) !== null && center < mid(i); i--) to = i;
    }
    return to;
  };

  const tick = () => Haptics.selectionAsync().catch(() => {});

  const start = (index, pageY) => {
    const key = items[index].key;
    Keyboard.dismiss();
    store.begin({ from: index, to: index, startY: pageY });
    translateY.setValue(0);
    setDragState({ key, from: index, to: index, height: store.layoutOf(key)?.height ?? 0 });
    onDragActiveChange?.(true);
    tick();
  };

  const update = (pageY) => {
    const d = store.active();
    if (!d) return;
    const dy = pageY - d.startY;
    translateY.setValue(dy);
    const to = targetIndex(d.from, dy);
    if (to !== d.to) {
      d.to = to;
      setDragState((s) => s && { ...s, to });
      tick();
    }
  };

  const end = () => {
    const d = store.finish();
    setDragState(null);
    translateY.setValue(0);
    onDragActiveChange?.(false);
    if (d) move(d.from, d.to);
  };

  const handleProps = (index) => ({
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e) => start(index, e.nativeEvent.pageY),
    onResponderMove: (e) => update(e.nativeEvent.pageY),
    onResponderRelease: end,
    onResponderTerminate: end,
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: 'Reorder',
    accessibilityHint: 'Drag, or swipe up or down to move',
    accessibilityActions: [
      { name: 'decrement', label: 'Move up' },
      { name: 'increment', label: 'Move down' },
    ],
    onAccessibilityAction: (e) => {
      if (e.nativeEvent.actionName === 'decrement') move(index, index - 1);
      if (e.nativeEvent.actionName === 'increment') move(index, index + 1);
    },
  });

  return (
    <View>
      {items.map((item, index) => {
        const isDragging = dragState?.key === item.key;
        // Rows between the lifted row's origin and its drop slot slide one
        // row-height toward the gap it left.
        let shift = 0;
        if (dragState && !isDragging) {
          const { from, to, height } = dragState;
          if (from < to && index > from && index <= to) shift = -height;
          else if (from > to && index >= to && index < from) shift = height;
        }
        return (
          <Animated.View
            key={item.key}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              store.setLayout(item.key, { y, height });
            }}
            style={
              isDragging
                ? [styles.reorder_dragging, { transform: [{ translateY }] }]
                : shift
                  ? { transform: [{ translateY: shift }] }
                  : null
            }
          >
            {renderItem({ item, index, isDragging, dragHandleProps: handleProps(index) })}
          </Animated.View>
        );
      })}
    </View>
  );
};

export default ReorderableList;
