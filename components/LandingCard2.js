import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../styles/theme';

// A second LandingCard variant: a smooth oval body with four small,
// non-concave points at top, bottom, left, and right.
//
//   - The body is built from 8 convex cubic Béziers (no inward dips).
//   - Each cardinal direction (N/E/S/W) has a small cusp pointing outward,
//     formed where two convex arcs meet at a tangent break.
//   - 4-fold mirror symmetry about (100, 58).
//
// Same API surface as LandingCard. Pass `fill` / `stroke` / `width` /
// `height` props; the SVG fills the outer View via StyleSheet.absoluteFill.
const SHAPE_PATH = `
  M 100 4
  C 115 8 150 20 160 25
  C 170 30 192 48 196 58
  C 192 68 170 86 160 91
  C 150 96 115 108 100 112
  C 85 108 50 96 40 91
  C 30 86 8 68 4 58
  C 8 48 30 30 40 25
  C 50 20 85 8 100 4
  Z
`;

const LandingCard2 = ({
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
    paddingHorizontal: 52,
    paddingVertical: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LandingCard2;
