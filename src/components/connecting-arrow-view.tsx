import { easeExp } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Animate } from 'react-move';
import { centroid, P } from '../utils/vec';
import { Path, positionLink, tweak } from './arrow-view';
import { IConnectingArrow } from './models';
interface Props {
  arrow: IConnectingArrow;
}

const ConnectingArrowViewVanilla: React.SFC<Props> = ({
  arrow: { from, to: candidate, toX, toY, intersectionX, intersectionY, distance },
}) => {

  const height = 20;
  const width = 20;
  const cursorBox = {
    x: toX - width / 2,
    y: toY - height / 2,
    width,
    height,
  };

  // const dev = false;
  // let intersectionD: string | undefined;
  // if (dev && intersectionX && intersectionY) {
  //   intersectionD = `M ${toX} ${toY} L ${intersectionX} ${intersectionY}`;
  // }
  const { end, control: c2 } = tweak(centroid(from), candidate || cursorBox, 10, 70);
  const { end: start, control: c1 } = tweak(centroid(candidate || cursorBox), from, 0, 30);

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
          <Path d={d as string} />
          {/* {intersectionD && (
            <path d={intersectionD} strokeWidth={1} fill="none" stroke="red" />
          )}
          {intersectionD &&
            distance && (
              <text x={toX} y={toY} dy={-20} dx={-20}>
                {distance.toFixed(0)}
              </text>
            )} */}
        </g>
      )}
    </Animate>
  );
};

export const ConnectingArrowView = observer(ConnectingArrowViewVanilla);
