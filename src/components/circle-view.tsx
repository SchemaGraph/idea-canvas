import * as React from 'react';
import styled from 'styled-components';
import { Zoom } from '../store';
import { colors } from '../theme/theme';
import { IBox } from './models';
import { observer } from 'mobx-react';

interface Props {
  box: IBox;
  zoom: Zoom;
  selected?: boolean;
}
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
  z-index: 1;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 400;
  font-size: 12px;
  /* transform: translate(-50%); */
`;
type FinalProps = Props & React.HTMLAttributes<HTMLDivElement>;

const CircleViewBase = React.forwardRef<HTMLDivElement, FinalProps>(
  ({ box, selected, children, zoom, style, ...rest }, ref) => (
    <CircleDiv
      style={{ ...getStyle(box, 0.8), ...(style || {}) }}
      selected={!!selected}
      innerRef={ref as any}
      {...rest}
    >
      <Label>{box.name || `\xa0`}</Label>
      {children}
    </CircleDiv>
  )
);
// export const CircleView = CircleViewBase;

export const CircleView = observer(CircleViewBase);
