import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../styles/theme';

// Magnifying glass icon (Heroicons-style).
const SearchIcon = ({ size = 24, color = colors.textSecondary, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SearchIcon;
