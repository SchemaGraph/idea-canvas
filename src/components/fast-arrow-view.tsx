import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../theme/theme';
import { a, centroid, mult, P, Rectangle, scale, V } from '../utils/vec';
import { IArrow } from '../models/models';

const ARROW_ID = 'arrow';

const strokeColor = colors.white.alpha(0.8).string();
const markerEnd = `url(#${ARROW_ID})`;
export const Path = styled.path`
  stroke-width: 1;
  cursor: pointer;
  marker-end: ${markerEnd};
  stroke: ${strokeColor};
  fill: none;
`;

// const boxHeight = 60;
interface Props {
  arrow: IArrow;
}

function slope(x: number, y: number, minX = 1e-3) {
  const xx = Math.abs(x) < minX ? minX : x;
  return y / xx;
}

export function tweak(
  start: P,
  to: Rectangle,
  endpointMargin = 0,
  controlMargin = 30
) {
  // middle of the target box, when origo is at 0,0
  const end: P = centroid(to);
  const [w, h] = [to.width, to.height];
  // the middle of the *target* box, when origo is at *start*
  const m = a(end, scale(start, -1));
  const [cx, cy] = m;
  // |k| of the connector line
  const k = Math.abs(slope(cx, cy));
  // |k| of the box diagonal
  const k1 = Math.abs(slope(w, h));
  // top, right, bottom, left
  const side = k > k1 ? (cy > 0 ? 1 : 3) : cx < 0 ? 2 : 4;
  // rotate in 90-degree increments clockwise
  const rotation: V = [
    [[1, 0], [0, 1]] as V,
    [[0, 1], [-1, 0]] as V,
    [[-1, 0], [0, -1]] as V,
    [[0, -1], [1, 0]] as V,
  ][side - 1];
  // length to the side from the middle
  const l = [h, w, h, w][side - 1];
  const u: P = [0, -1]; // unit vector pointing up
  const v = scale(u, l / 2 + endpointMargin); // to the side + offset
  const newEnd = mult(rotation, v);

  const ll = Math.hypot(cx, cy);
  const vv = scale(u, Math.min(Math.max(ll / 2, l), l + controlMargin)); // to the side + offset
  const control = mult(rotation, vv);

  // The point where the line between the midpoints crosses the border
  // const radius =
  //   Math.min(w / 2 / Math.cos(alpha), h / 2 / Math.sin(alpha)) + margin;
  // const fix = scale(normalized, (-1 * radius) / length(normalized));

  return {
    side,
    k,
    start,
    end: a(a(newEnd, m), start),
    control: a(a(control, m), start),
  };
}

export function positionLink(s: P, e: P, c1: P, c2: P) {
  return `M ${s[0]} ${s[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${e[0]} ${
    e[1]
  }`;
}
const ArrowViewVanilla: React.FC<Props> = ({ arrow }) => {
  const { source: from, target: to } = arrow;
  if (!from || !to) {
    return null;
  }
  // tries to compute the closest point on the *border* of the box
  const { end, control: c2 } = tweak(centroid(from), to, 3, 70);
  const { end: start, control: c1 } = tweak(centroid(to), from, 0, 70);
  return <Path d={positionLink(start, end, c1, c2)} />;
};

export const FastArrowView = observer(ArrowViewVanilla);
