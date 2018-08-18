// import { Spring } from 'react-spring';
import { easeExp } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Animate } from 'react-move';
import styled from 'styled-components';
import { colors } from '../theme/theme';
import { connect } from '../utils';
import { a, centroid, mult, P, Rectangle, scale, V } from '../utils/vec';
import { IArrow, IBox } from './models';

interface PathProps {
  selected?: boolean;
}

const ARROW_SELECTED_ID = 'arrow-selected';
const ARROW_ID = 'arrow';

export const Path = styled.path`
  stroke-width: 2;
  cursor: pointer;
  marker-end: ${p =>
    p.selected ? `url(#${ARROW_SELECTED_ID})` : `url(#${ARROW_ID})`};
  stroke: ${({ selected }: PathProps) =>
    (selected ? colors.orange : colors.white).toString()}};
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
  // angle of the connector line
  const alpha = Math.atan(Math.abs(cy / cx));
  // angle of the box diagonal
  const beta = Math.atan(h / w);
  // top, right, bottom, left
  const side = alpha > beta ? (cy > 0 ? 1 : 3) : cx < 0 ? 2 : 4;
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
  const { from, to, id } = arrow;
  if (!from || !to) {
    return null;
  }
  const select: React.MouseEventHandler = () => {
    onSelect!(id);
  };
  // tries to compute the closest point on the *border* of the box
  const { end, control: c2 } = tweak(centroid(from), to, 10, 70);
  const { end: start, control: c1 } = tweak(centroid(to), from, 0, 30);

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
        stroke="blue"
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
