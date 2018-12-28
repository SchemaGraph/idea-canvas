import { IBox } from '../components/models';

export type P = [number, number];
export type V = [P, P];
// const nil: V = [[0, 0], [0, 0]];
export function length2(p: P) {
  return Math.hypot(p[0], p[1]);
}
// export function add(x: V, y: V): V {
//   return [a(x[0], y[0]), a(x[1], y[1])];
// }
export function a(x: P, y: P): P {
  return [x[0] + y[0], x[1] + y[1]];
}
export function scale(p: P, c: number): P {
  return [c * p[0], c * p[1]];
}
/**
 * 2D Matrix-vector multiplication
 */
export function mult(A: V, x: P): P {
  return [A[0][0] * x[0] + A[1][0] * x[1], A[0][1] * x[0] + A[1][1] * x[1]];
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function centroid({ x, y, width, height }: Rectangle): P {
  return [x + width / 2, y + height / 2];
}

export function getCloseEnoughBox(
  point: P,
  bs: IterableIterator<IBox>,
  r = 10
) {
  let closest: [number, IBox] | undefined = undefined;
  for (const box of bs) {
    const d = pointToRect(point, box);

    if (d === undefined) {
      // we are inside the box
      return box;
    }
    if (d.distance < r && (!closest || closest[0] > d.distance)) {
      closest = [d.distance, box];
    }
  }
  return closest ? closest[1] : undefined;
}

export function pointToRect(point: P, rect: IBox) {
  const [w, h] = [rect.width / 2, rect.height / 2];
  // let's choose the center of the rectangle as the origo
  const O = centroid(rect);
  const OP = a(point, scale(O, -1));
  const [x, y] = OP;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  // clockwise, with lower right as 1
  const quadrant = x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3;
  const axes: P = [[w, h] as P, [-w, h] as P, [-w, -h] as P, [w, -h] as P][
    quadrant - 1
  ];

  // Vector from middle of the rectangle to the closest corner
  const OC: P = [axes[0], axes[1]];
  // Vector from the point to the closest corner
  const PC = a(OP, scale(OC, -1));

  if (ax <= w && ay <= h) {
    // we are inside the rectangle
    return undefined;
  }
  if (ax <= w && ay > h) {
    const OQ: P = [x, axes[1]];
    const PQ = a(OP, scale(OQ, -1));
    return {
      distance: length2(PQ),
      intersection: a(OQ, O),
    };
  }
  if (ax > w && ay <= h) {
    const OQ: P = [axes[0], y];
    const PQ = a(OP, scale(OQ, -1));
    return {
      distance: length2(PQ),
      intersection: a(OQ, O),
    };
  }
  return {
    distance: length2(PC),
    intersection: a(OC, O),
  };
}
