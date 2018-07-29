import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { IArrow } from './models';

const Path = styled.path`
  stroke-width: 2;
  stroke: white;
  marker-end: url(#arrow);
`;
const boxHeight = 60;
interface Props {
  arrow: IArrow;
}
type P = [number, number];
type V = [P, P];
const nil: V = [[0, 0], [0, 0]];
function length(v: V) {
  return ((v[1][0] - v[0][0]) ** 2 + (v[1][1] - v[0][1]) ** 2) ** 0.5;
}
function add(x: V, y: V): V {
  return [
    [x[0][0] + y[0][0], x[0][1] + y[0][1]],
    [x[1][0] + y[1][0], x[1][1] + y[1][1]],
  ];
}
function scale(v: V, a: number): V {
  return [[a * v[0][0], a * v[0][1]], [a * v[1][0], a * v[1][1]]];
}
function tweak(v: V, w: number, h: number) {
  // console.log(length(scale(v, 1.1)) / length(v));
  const o: V = [v[0].slice(), v[0].slice()] as V;
  const normalized = add(v, scale(o, -1)); // starts from origo
  const alpha = Math.atan(Math.abs(normalized[1][1] / normalized[1][0]));
  const radius = Math.min((w/2) / Math.cos(alpha), (h/2) / Math.sin(alpha));// ((w / 2) ** 2 + (h / 2) ** 2) ** 0.5;
  // console.log(radius);
  const fix = scale(normalized, -1*radius / length(normalized));
  // console.log(length(unit));
  return add(add(normalized, fix), o);
}
const ArrowViewVanilla: React.SFC<Props> = ({ arrow }) => {
  const { from, to } = arrow;
  if (!from || !to) {
    return null;
  }
  const [s, e] = tweak(
    [[from.x + from.width / 2, from.y + 30], [to.x + to.width / 2, to.y + 30]],
    to.width,
    boxHeight
  );
  return <Path d={`M${s[0]} ${s[1]} L${e[0]} ${e[1]}`} />;
};

export const ArrowView = observer(ArrowViewVanilla);
