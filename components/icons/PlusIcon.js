import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../styles/theme';

// Thin plus icon — two crossed strokes (Heroicons-style).
// Usage:
//   <PlusIcon size={24} color={colors.link} />
const PlusIcon = ({ size = 24, color = colors.textSecondary, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.5v15m7.5-7.5h-15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default PlusIcon;
