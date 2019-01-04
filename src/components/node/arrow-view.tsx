import { easeExp } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Animate } from 'react-move';
import styled from 'styled-components';
import { colors } from '../../theme/theme';
import { connect } from '../../utils';
import { a, centroid, mult, P, Rectangle, scale, V } from '../../utils/vec';
import { IArrow, IBox } from '../../models/models';

interface PathProps {
  selected?: boolean;
}

const ARROW_SELECTED_ID = 'arrow-selected';
const ARROW_ID = 'arrow';

const strokeColor = ({ selected }: PathProps) =>
  (selected ? colors.orange : colors.white).alpha(0.8).string();
const markerEnd = ({ selected }: PathProps) =>
  selected ? `url(#${ARROW_SELECTED_ID})` : `url(#${ARROW_ID})`;
export const Path = styled.path`
  stroke-width: 1;
  cursor: pointer;
  marker-end: ${markerEnd};
  stroke: ${strokeColor};
  fill: none;
`;
const GhostPath = styled.path`
  stroke-width: 20;
  cursor: pointer;
  stroke: transparent;
  fill: none;
`;

// const boxHeight = 60;
interface Props {
  arrow: IArrow;
  onSelect?: (id: string) => void;
  selected?: boolean;
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
const ArrowViewVanilla: React.SFC<Props> = ({ arrow, onSelect, selected }) => {
  const { source: from, target: to, id } = arrow;
  if (!from || !to) {
    return null;
  }
  const select: React.MouseEventHandler = () => {
    onSelect!(id);
  };
  // tries to compute the closest point on the *border* of the box
  const { end, control: c2, side: toSide, k: toK } = tweak(
    centroid(from),
    to,
    3,
    70
  );
  const { end: start, control: c1, side: fromSide, k: fromK } = tweak(
    centroid(to),
    from,
    0,
    70
  );
  // console.log(fromK.toFixed(1), toK.toFixed(1));
  const data = { d: positionLink(start, end, c1, c2), opacity: 0 };
  return (
    <Animate
      start={data}
      enter={{
        opacity: [1],
        timing: { duration: 100 },
        easing: easeExp,
      }}
      update={{
        d: [data.d],
        timing: { delay: 0, duration: 70, easing: easeExp },
      }}
    >
      {({ d, opacity }) => (
        <g>
          <Path
            d={d as string}
            selected={selected}
            opacity={opacity as number}
          />
          <GhostPath d={d as string} onClick={select} />
          {/* <circle cx={start[0]} cy={start[1]} r={3} fill="red" />
          <circle cx={end[0]} cy={end[1]} r={3} fill="red" /> */}
          {/* {debug(from, to, c1, c2)} */}
        </g>
      )}
    </Animate>
  );
};

function debug(from: IBox, to: IBox, c1: P, c2: P) {
  const mStart: P = [from.x + from.width / 2, from.y + from.height / 2];
  const mEnd: P = [to.x + to.width / 2, to.y + to.height / 2];

  return (
    <g>
      <circle cx={c1[0]} cy={c1[1]} r={3} fill="red" />
      <circle cx={c2[0]} cy={c2[1]} r={3} fill="red" />
      <path
        d={`M ${mStart[0]} ${mStart[1]} L ${mEnd[0]} ${mEnd[1]}`}
        stroke="red"
        fill="none"
      />
      <rect
        x={to.x}
        y={to.y}
        width={to.width}
        height={to.height}
        fill="none"
        stroke="red"
        strokeWidth="1"
      />
      <rect
        x={from.x}
        y={from.y}
        width={from.width}
        height={from.height}
        fill="none"
        stroke="red"
        strokeWidth="1"
      />
    </g>
  );
}

export const ArrowView = connect<Props>((store, { arrow }) => ({
  arrow,
  onSelect: store.select,
  selected: store.selection === arrow.id,
}))(observer(ArrowViewVanilla));

export const MarkerArrowDef = () => (
  <marker
    id={ARROW_ID}
    viewBox="0 0 10 10"
    refX="5"
    refY="5"
    markerWidth="6"
    markerHeight="6"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.white.toString()} />
  </marker>
);

export const MarkerSelectedArrowDef = () => (
  <marker
    id={ARROW_SELECTED_ID}
    viewBox="0 0 10 10"
    refX="5"
    refY="5"
    markerWidth="6"
    markerHeight="6"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.orange.toString()} />
  </marker>
);
