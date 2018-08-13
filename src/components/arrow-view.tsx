// import { Spring } from 'react-spring';
import { easeExp } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Animate } from 'react-move';
import styled from 'styled-components';
import { colors } from '../theme/theme';
import { connect } from '../utils';
import { IArrow, IBox } from './models';

interface PathProps {
  selected?: boolean;
}

const Path = styled.path`
  stroke-width: 2;
  cursor: pointer;
  marker-end: ${p => (p.selected ? `url(#arrow-selected)` : `url(#arrow)`)};
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
type P = [number, number];
type V = [P, P];
// const nil: V = [[0, 0], [0, 0]];
function length(p: P) {
  return Math.hypot(p[0], p[1]);
}
function add(x: V, y: V): V {
  return [a(x[0], y[0]), a(x[1], y[1])];
}
function a(x: P, y: P): P {
  return [x[0] + y[0], x[1] + y[1]];
}
function scale(p: P, c: number): P {
  return [c * p[0], c * p[1]];
}
function mult(A: V, x: P): P {
  return [A[0][0] * x[0] + A[1][0] * x[1], A[0][1] * x[0] + A[1][1] * x[1]];
}
function tweak(from: IBox, to: IBox, endpointMargin = 0, controlMargin = 30) {
  // middle of the origin box, when origo is at 0,0
  const start: P = [from.x + from.width / 2, from.y + from.height / 2];
  // middle of the target box, when origo is at 0,0
  const end: P = [to.x + to.width / 2, to.y + to.height / 2];
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

function positionLink(s: P, e: P, c1: P, c2: P) {
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
  const { end, control: c2 } = tweak(from, to, 10, 70);
  const { end: start, control: c1 } = tweak(to, from, 0, 30);


  const data = { d: positionLink(start, end, c1, c2) };
  return (
    <Animate
      start={data}
      enter={data}
      update={{
        d: [data.d],
        timing: { delay: 0, duration: 70, easing: easeExp },
      }}
    >
      {({ d }) => (
        <g>
          <Path d={d as string} selected={selected} />
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


export const ArrowView = connect<Props>((store, {arrow}) => ({
  arrow,
  onSelect: store.select,
  selected: store.selection === arrow.id
}))(observer(ArrowViewVanilla));
