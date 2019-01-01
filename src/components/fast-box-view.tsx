import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { Zoom } from '../models/store';
import { colors } from '../theme/theme';
import { IBox } from '../models/models';

interface Props {
  box: IBox;
  zoom: Zoom;
  selected?: boolean;
}

interface BoxDivProps {
  selected: boolean;
}

const selectedColor = colors.orange.rgb().string();

export const longPressDuration = 800;
const BoxDiv = styled.div`
  border: 2px solid white;
  padding: 16px;
  position: absolute;
  border-radius: 8px;
  cursor: pointer;
  color: white;
  white-space: nowrap;
  -webkit-touch-callout: none;
  user-select: none;
  transform-origin: 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  touch-action: none;
  box-shadow: ${(p: BoxDivProps) =>
    p.selected ? `0 0 7px 2px ${selectedColor}` : `none`};
  transition: box-shadow 0.2s ease-in-out;
  font-size: 16px;
  will-change: transform;
`;

function getStyle(
  { x, y, context }: IBox,
  opacity = 1,
  _isDragging?: boolean
): React.CSSProperties {
  return {
    transform: `translate(${x}px,${y}px)`,
    opacity,
    backgroundColor: context ? context.color : 'transparent',
  };
}
const Label = styled.div`
  display: inline-block;
  text-align: center;
  z-index: 1;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  font-size: 16px;
`;

type FinalProps = Props & React.HTMLAttributes<HTMLDivElement>;

const BoxViewBase = React.forwardRef<HTMLDivElement, FinalProps>(
  ({ box, selected, children, zoom, style, ...rest }, ref) => (
    <BoxDiv
      style={{ ...getStyle(box, 0.8), ...(style || {}) }}
      selected={!!selected}
      innerRef={ref as any}
      {...rest}
    >
      <Label>{box.name || `\xa0`}</Label>
      {children}
    </BoxDiv>
  )
);
// export const BoxView = BoxViewBase;

export const FastBoxView = observer(BoxViewBase);
