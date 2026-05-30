import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../styles/theme';

// A decorative oval-with-cusps shape used behind the Landing title.
//
//   - viewBox aspect (200×116, ratio ~1.72) matches the rendered View aspect
//     so SVG stretches X and Y equally — no elongation of the side bulges.
//   - Sharp peaks at top + bottom with concave dips on either side.
//   - Side bulges designed roughly square in viewBox so they render round.
//
// Eight cubic Bézier segments — two per quadrant — with 4-fold mirror
// symmetry about (100, 58). All coordinate pairs verify symmetric about
// x=100 and y=58.
//
// The component sizes its outer View to its children by default (no fixed
// width/height); the SVG fills behind via StyleSheet.absoluteFill +
// preserveAspectRatio="none". Pass `width` / `height` if you want a fixed
// box instead.
const SHAPE_PATH = `
  M 100 4
  C 115 27 140 30 160 25
  C 180 20 195 40 195 58
  C 195 76 180 96 160 91
  C 140 86 115 89 100 112
  C 85 89 60 86 40 91
  C 20 96 5 76 5 58
  C 5 40 20 20 40 25
  C 60 30 85 27 100 4
  Z
`;

const LandingCard = ({
  width,
  height,
  fill = colors.background,
  stroke = 'transparent',
  strokeWidth = 0,
  children,
  contentStyle,
  style,
}) => {
  const sizeStyle = {};
  if (width != null) sizeStyle.width = width;
  if (height != null) sizeStyle.height = height;

  return (
    <View style={[styles.outer, sizeStyle, style]}>
      <Svg
        width={width ?? '100%'}
        height={height ?? '100%'}
        viewBox="0 0 200 116"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path d={SHAPE_PATH} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </Svg>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // Inset the text from the cusps. Tune these if the card looks too tight
    // or too roomy around the title/subtitle.
    paddingHorizontal: 52,
    paddingVertical: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LandingCard;
