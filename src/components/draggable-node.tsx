import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { connect } from '../utils';

interface Props {
  startUndoGroup: () => void;
  stopUndoGroup: () => void;
  longPress: number;
  onClick: () => void;
  onLongPress: () => void;
  onStart: DraggableEventHandler;
  onDrag: DraggableEventHandler;
  onStop: DraggableEventHandler;
}

export const longPressDuration = 800;

const emptyFn = () => {};

class DraggableNodeBase extends React.Component<Props> {
  public static defaultProps: Partial<Props> = {
    startUndoGroup: emptyFn,
    stopUndoGroup: emptyFn,
    onClick: emptyFn,
    onLongPress: emptyFn,
    longPress: 300,
    onStart: emptyFn,
    onDrag: emptyFn,
    onStop: emptyFn,
  };
  private dragStart?: {
    initialPosition: { x: number; y: number };
    latestPosition?: { x: number; y: number };
    instant: number;
  };

  private onDragStart: DraggableEventHandler = (e, data) => {
    const { x, y } = data;
    this.props.startUndoGroup();
    this.dragStart = {
      initialPosition: { x, y },
      instant: Date.now(),
    };
    this.props.onStart(e, data);
    setTimeout(this.testLongPress, this.props.longPress);
  };

  private testLongPress = () => {
    if (
      this.isItDragging() === false &&
      this.pressedFor() > this.props.longPress
    ) {
      this.props.onLongPress();
    }
  };

  private isItDragging = () => {
    if (this.dragStart) {
      let d = 0;
      if (this.dragStart.latestPosition) {
        const { x: x1, y: y1 } = this.dragStart.initialPosition;
        const { x: x2, y: y2 } = this.dragStart.latestPosition;
        d = Math.hypot(x2 - x1, y2 - y1);
      }
      if (d < 0.01) {
        return false;
      }
      return true;
    }
    return undefined;
  };

  private pressedFor = () => {
    if (this.dragStart) {
      return Date.now() - this.dragStart.instant;
    }
    return 0;
  };

  public onDragStop: DraggableEventHandler = (e, data) => {
    this.props.stopUndoGroup();

    if (this.dragStart) {
      const wasDragging = this.isItDragging();
      if (!wasDragging && this.pressedFor() < longPressDuration) {
        this.props.onClick();
      }

      this.dragStart = undefined;
    }
    this.props.onStop(e, data);
  };

  public move: DraggableEventHandler = (e, data) => {
    const { x, y } = data;
    if (this.dragStart) {
      this.dragStart.latestPosition = {
        x,
        y,
      };
    }
    this.props.onDrag(e, data);
  };

  public render() {
    return (
      <DraggableCore
        onDrag={this.move}
        onStart={this.onDragStart}
        onStop={this.onDragStop}
      >
        {this.props.children}
      </DraggableCore>
    );
  }
}

export const DraggableNode = connect<Props>((store, props) => ({
  ...props,
  withoutUndo: store.undoManager.withoutUndo,
  startUndoGroup: store.undoManager.startGroup,
  stopUndoGroup: store.undoManager.stopGroup,
}))(DraggableNodeBase);
