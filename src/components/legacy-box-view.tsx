import { easeExp, easeExpOut } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { Animate } from 'react-move';
import styled from 'styled-components';
import { Zoom } from '../models/store';
import { colors } from '../theme/theme';
import { connect } from '../utils';
import { P } from '../utils/vec';
import { IBox, IContext } from '../models/models';
import { Ripple } from './ripple';
import { TOOL_CONNECT } from './toolbar/constants';

interface Props {
  box: IBox;
  zoom: Zoom;
  connect?: boolean;
  startConnecting: (from: IBox, to: P) => void;
  updateConnecting: (to: P) => void;
  endConnecting: () => void;
  onSelect: (id: string) => void;
  selected?: boolean;
  onEditing: (id: string | null) => void;
  onDeepEditing: (id: string | null) => void;
  withoutUndo: <T>(fn: () => T | void) => T | void;
  startUndoGroup: () => void;
  stopUndoGroup: () => void;
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
`;

function getStyle(
  x: number,
  y: number,
  _box: IBox,
  context?: IContext,
  opacity = 1,
  isDragging?: boolean
): React.CSSProperties {
  return {
    transform: `translate(${x}px,${y}px)`,
    opacity,
    backgroundColor: context ? context.color : 'transparent',
    transition: !isDragging ? 'transform 0.2s ease-out' : undefined,
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

const emptyFn = () => {};

class BoxViewVanilla extends React.Component<Props> {
  public static defaultProps: Partial<Props> = {
    startConnecting: emptyFn,
    updateConnecting: emptyFn,
    endConnecting: emptyFn,
    onSelect: emptyFn,
    onEditing: emptyFn,
    onDeepEditing: emptyFn,
    selected: false,
    withoutUndo: <T extends any>(_fn?: () => T) => {},
    startUndoGroup: emptyFn,
    stopUndoGroup: emptyFn,
  };
  private boxRef = React.createRef<HTMLDivElement>();
  private ripple = React.createRef<Ripple>();
  private dragStart?: {
    initialPosition: { x: number; y: number };
    latestPosition?: { x: number; y: number };
    instant: number;
  };

  public dblClickHandler: React.MouseEventHandler<HTMLDivElement> = _e => {
    const {
      onEditing,
      box: { id },
    } = this.props;
    onEditing(id);
  };

  public start: DraggableEventHandler = (_e, { x, y }) => {
    const {
      box,
      connect: connectTool,
      startConnecting,
      zoom: { k: scale },
      startUndoGroup,
    } = this.props;
    // setIsDragging(box.id);
    startUndoGroup();
    this.dragStart = {
      initialPosition: { x, y },
      instant: Date.now(),
    };
    if (connectTool) {
      startConnecting(box, [x / scale, y / scale]);
    } else {
      setTimeout(this.possiblyMakeRipples, longPressDuration);
    }
  };

  possiblyMakeRipples = () => {
    if (this.isItDragging() === false && this.ripple.current) {
      this.ripple.current.ripple();
      if (this.dragStart) {
        if (
          this.isItDragging() === false &&
          this.pressedFor() > longPressDuration
        ) {
          this.props.onDeepEditing(this.props.box.id);
        }
      }
    }
  };

  isItDragging = () => {
    if (this.dragStart) {
      const { connect: connectTool } = this.props;
      let d = 0;
      if (this.dragStart.latestPosition) {
        const { x: x1, y: y1 } = this.dragStart.initialPosition;
        const { x: x2, y: y2 } = this.dragStart.latestPosition;
        d = Math.hypot(x2 - x1, y2 - y1);
      }
      // const dt = Date.now() - this.dragStart.instant; // in ms
      // console.log('BOX MOVE END', d);
      if (d < 0.01 && !connectTool) {
        return false;
      }
      return true;
    }
    return undefined;
  };

  pressedFor = () => {
    if (this.dragStart) {
      return Date.now() - this.dragStart.instant;
    }
    return 0;
  };

  public stop: DraggableEventHandler = () => {
    const { connect: connectTool, endConnecting } = this.props;
    // setIsDragging();
    this.props.stopUndoGroup();

    if (this.dragStart) {
      const wasDragging = this.isItDragging();
      if (!wasDragging && this.pressedFor() < longPressDuration) {
        this.select();
      }

      this.dragStart = undefined;
    }
    if (connectTool) {
      endConnecting();
    }
  };

  public move: DraggableEventHandler = (_e, { x, y, deltaX, deltaY }) => {
    const {
      box,
      connect: connectTool,
      updateConnecting,
      zoom: { k: scale },
    } = this.props;
    if (connectTool) {
      updateConnecting([x / scale, y / scale]);
    } else {
      box.move(deltaX / scale, deltaY / scale);
    }
    if (this.dragStart) {
      this.dragStart.latestPosition = {
        x,
        y,
      };
    }
  };

  private select = () => {
    const {
      onSelect,
      box: { id },
    } = this.props;
    onSelect(id);
  };

  public componentDidMount() {
    this.measure();
  }

  public componentDidUpdate() {
    this.measure();
  }

  public measure() {
    // console.log('measure');
    const ref = this.boxRef.current;
    const {
      width,
      height,
      setDimensions,
      setWidth,
      setHeight,
    } = this.props.box;
    const { withoutUndo } = this.props;
    // console.log('MAYBE MEASURING');
    if (ref) {
      const { offsetWidth, offsetHeight } = ref;
      // console.log('MEASURED', clientWidth, clientHeight);
      const dW = width - offsetWidth;
      const dH = height - offsetHeight;
      if (dW && dH) {
        withoutUndo(() => setDimensions(offsetWidth, offsetHeight));
      } else if (dW) {
        withoutUndo(() => setWidth(offsetWidth));
      } else if (dH) {
        withoutUndo(() => setHeight(dH));
      }
    }
  }

  public render() {
    const { box, selected } = this.props;
    const { name, context } = box;
    return (
      <Animate
        start={{ x: box.x, y: box.y, opacity: 0 }}
        enter={{
          opacity: [1],
          timing: { duration: 100 },
          easing: easeExp,
        }}
        update={{
          x: box.x,
          y: box.y,
          timing: { duration: 30 },
          easing: easeExpOut,
        }}
      >
        {({ opacity, x, y }) => (
          <DraggableCore
            onDrag={this.move}
            onStart={this.start}
            onStop={this.stop}
          >
            <BoxDiv
              innerRef={this.boxRef}
              style={getStyle(
                x as number,
                y as number,
                box,
                context,
                opacity as number,
                !!this.dragStart
              )}
              onDoubleClick={this.dblClickHandler}
              selected={selected || false}
            >
              <Label>{name || `\xa0`}</Label>
              <Ripple duration={500} ref={this.ripple} />
            </BoxDiv>
          </DraggableCore>
        )}
      </Animate>
    );
  }
}

export const BoxView = connect<Props>((store, { box, zoom }) => ({
  zoom,
  box,
  connect: store.tool === TOOL_CONNECT,
  startConnecting: store.startConnecting,
  updateConnecting: store.updateConnecting,
  endConnecting: store.endConnecting,
  onSelect: store.select,
  onEditing: store.setEditing,
  onDeepEditing: store.setDeepEditing,
  selected: store.selection === box.id,
  withoutUndo: store.undoManager.withoutUndo,
  startUndoGroup: store.undoManager.startGroup,
  stopUndoGroup: store.undoManager.stopGroup,
}))(observer(BoxViewVanilla));
