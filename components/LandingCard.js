import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Polygon } from 'react-native-svg';
import { colors } from '../styles/theme';

// Pill body with 4 small triangular points layered on top — one at each
// cardinal direction (top, right, bottom, left).
//
// Visual composition (all shapes share the same fill color so they
// merge into one continuous silhouette):
//
//   - Pill body: a rounded rectangle where rx = ry = half the height,
//     so the short sides are perfect semicircles. The long sides are
//     straight. Sized 172×68 in the 200×116 viewBox, centered.
//
//   - 4 isosceles triangles (one per cardinal direction). Each base sits
//     2 viewBox units INSIDE the pill so the fills overlap with no
//     anti-alias seam; each apex sticks 12 viewBox units BEYOND the
//     pill edge. Designed with equal viewBox-extent in both axes
//     (12 units protrusion × 12 unit base), so after the SVG's
//     preserveAspectRatio="none" stretching to the View, all four
//     triangles render at roughly the same visible size.
//
// No concave curves anywhere — the points are formed entirely by the
// triangles being layered on top of (and slightly overlapping into) the
// pill body.

const LandingCard = ({
  width,
  height,
  fill = colors.primary,
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
        {/* Pill body — straight long sides, perfect semicircular ends */}
        <Rect
          x="14"
          y="24"
          width="172"
          height="68"
          rx="34"
          ry="34"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* 4 equilateral triangles — side 8 viewBox units (height ≈ 6.93,
            which is 8 × √3/2). Each base sits at y/x = 2 units inside the
            pill edge for an anti-alias-safe overlap; each apex sits the
            remaining ≈ 4.93 units beyond the pill. 4-fold mirror symmetry
            about (100, 58). */}
        {/* Top point */}
        <Polygon
          points="100,19.07 104,26 96,26"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Right point */}
        <Polygon
          points="190.93,58 184,62 184,54"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Bottom point */}
        <Polygon
          points="100,96.93 96,90 104,90"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {/* Left point */}
        <Polygon
          points="9.07,58 16,54 16,62"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
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
