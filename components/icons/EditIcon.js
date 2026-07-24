import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../styles/theme';

// Edit / pencil icon (Heroicons-style).
//
// Usage:
//   <EditIcon size={22} color={colors.primary} />
//
// Like the vector-icon wrappers in ./index, it also honors a `style` prop's
// fontSize/color so it can sit alongside text-styled icons (e.g.
// InputSelector passes style={styles.inputButtonText}).
const EditIcon = ({ size = 24, color = colors.text, strokeWidth = 1.5, style }) => {
  const resolvedSize = style?.fontSize ?? size;
  const resolvedColor = style?.color ?? color;
  return (
    <Svg width={resolvedSize} height={resolvedSize} viewBox="0 0 24 24" fill="none">
      <Path
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default EditIcon;
