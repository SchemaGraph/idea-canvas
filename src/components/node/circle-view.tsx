import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/theme';
import { IBox } from '../../models/models';
import { observer } from 'mobx-react';

interface CircleDivProps {
  selected: boolean;
}

const selectedColor = colors.orange.rgb().string();

const BORDER = 2;
const CircleDiv = styled.div`
  border: ${BORDER}px solid white;
  padding: 0px;
  position: absolute;
  border-radius: 100px;
  cursor: pointer;
  color: white;
  white-space: nowrap;
  -webkit-touch-callout: none;
  user-select: none;
  transform-origin: 0 0;
  display: flex;
  overflow: visible;
  touch-action: none;
  box-shadow: ${(p: CircleDivProps) =>
    p.selected ? `0 0 7px 2px ${selectedColor}` : `none`};
  transition: box-shadow 0.2s ease-in-out;
  font-size: 16px;
`;

function getStyle(
  { x, y, width, height, context }: IBox,
  opacity = 1
): React.CSSProperties {
  return {
    transform: `translate(${x}px,${y}px)`,
    width: `${width > 0 ? width : 20}px`,
    height: `${height > 0 ? height : 20}px`,
    opacity,
    backgroundColor: context ? context.color : 'transparent',
  };
}
const Label = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: inline-block;
  text-align: center;
  z-index: ${({ focused }) => (focused ? '10' : '1')};
  color: ${({ focused }) =>
    focused ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)'};
  font-weight: 400;
  font-size: ${({ focused }: { focused: boolean }) =>
    focused ? '16px' : '12px'};
  /* text-stroke: ${({ focused }) => (focused ? '1px black' : '0px')}; */
   text-shadow: ${({ focused }) =>
     focused
       ? `
       2px 4px 3px rgba(0,0,0,0.3);`
       : 'none'};
`;
type FinalProps = Props & React.HTMLAttributes<HTMLDivElement>;

interface Props {
  box: IBox;
  selected?: boolean;
  focused?: boolean;
}
const CircleViewBase = React.forwardRef<HTMLDivElement, FinalProps>(
  ({ box, selected, children, style, className, focused, ...rest }, ref) => (
    <CircleDiv
      style={{ ...getStyle(box, 0.8), ...(style || {}) }}
      selected={!!selected}
      innerRef={ref as any}
      className={'node-circle' + (className ? ' ' + className : '')}
      {...rest}
    >
      <Label focused={!!focused}>{box.name || `\xa0`}</Label>
      {children}
    </CircleDiv>
  )
);
// export const CircleView = CircleViewBase;

export const selector = '.node-circle';
export type NodeType = HTMLDivElement;

export const CircleView = observer(CircleViewBase);
