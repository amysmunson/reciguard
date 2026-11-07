import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../styles/theme';

// Favorite star (Heroicons "star" outline). `filled` fills it in.
// Defaults: filled = colors.favorite (accent blue; white in dark mode),
// outline = colors.text (black; white in dark mode).
// Usage:
//   <StarIcon filled={isFavorite} size={22} />
const STAR_PATH =
  'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z';

const StarIcon = ({ filled = false, size = 24, color, strokeWidth = 1.5, style }) => {
  const resolved = color ?? (filled ? colors.favorite : colors.text);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d={STAR_PATH}
        stroke={resolved}
        fill={filled ? resolved : 'none'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default StarIcon;
