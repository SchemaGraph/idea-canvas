import * as React from 'react';
import styled from 'styled-components';
import { IBox } from '../../models/models';
import { observer } from 'mobx-react';

interface Props {
  box: IBox;
  selected?: boolean;
}

const BORDER = 2;
const Circle = styled.circle`
  cursor: pointer;
  color: white;
  will-change: transform;
`;

type FinalProps = Props & React.SVGAttributes<SVGCircleElement>;

const CircleViewBase = React.forwardRef<SVGCircleElement, FinalProps>(
  (
    { box: { x, y, width, context }, selected, children, style, ...rest },
    ref
  ) => (
    <g stroke="#fff" strokeWidth={BORDER}>
      <Circle
        cx={x + width / 2}
        cy={y + width / 2}
        // cx={0}
        // cy={0}
        r={width / 2}
        fill={context ? context.color : 'none'}
        opacity={0.8}
        innerRef={ref as any}
        // style={{
        //   transform: `translate(${x + width / 2}px,${y + width / 2}px)`,
        // }}
        {...rest}
      >
        {children}
      </Circle>
    </g>
  )
);
// export const CircleView = CircleViewBase;

export const SvgCircleView = observer(CircleViewBase);
