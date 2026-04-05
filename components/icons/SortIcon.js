import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../styles/theme';

// Three-slider / adjustments icon (Heroicons "AdjustmentsHorizontal" style).
// Used as the sort button on Home, sitting alongside the funnel filter.
const SortIcon = ({ size = 24, color = colors.textSecondary, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" 
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SortIcon;
