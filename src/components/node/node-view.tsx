import * as React from 'react';
import { DraggableEventHandler } from 'react-draggable';
import { connect } from '../../utils';
import { IBox } from '../../models/models';
import { DraggableNode } from './draggable-node';
import { P } from '../../utils/vec';
import { TOOL_CONNECT } from '../toolbar/constants';
import { observer } from 'mobx-react';
import { GraphSimulation, SimulationNode } from '../../force-layout';
import { ZoomTransform } from 'd3-zoom';

interface Props {
  box: IBox;
  zoomTransform: () => ZoomTransform;
  onSelect: (id: string) => void;
  selected: boolean;
  onEdit: (id: string | null) => void;
  onDeepEdit: (id: string | null) => void;
  withoutUndo: <T>(fn: () => T | void) => T | void;
  startUndoGroup: () => void;
  stopUndoGroup: () => void;
  measureWidth: boolean;
  measureHeight: boolean;
  connectMode: boolean;
  startConnecting: (from: IBox, to: P) => void;
  updateConnecting: (to: P) => void;
  endConnecting: () => void;
  simulation?: GraphSimulation;
}

const emptyFn = () => {};
export const longPressDuration = 600;

function didItMove(start: P, end: P, tol = 0.04) {
  return Math.hypot(end[0] - start[0], end[1] - start[1]) > tol;
}

class NodeViewBase extends React.Component<Props> {
  public static defaultProps: Partial<Props> = {
    onSelect: emptyFn,
    onEdit: emptyFn,
    onDeepEdit: emptyFn,
    startConnecting: emptyFn,
    updateConnecting: emptyFn,
    endConnecting: emptyFn,
    withoutUndo: <T extends any>(_fn?: () => T) => {},
    startUndoGroup: emptyFn,
    stopUndoGroup: emptyFn,
    measureWidth: false,
    measureHeight: false,
    selected: false,
    connectMode: false,
  };

  private dragState?: {
    initialPosition: P;
    latestPosition?: P;
    startedAt: number;
  };

  private simulationNode: SimulationNode | undefined;
  private boxRef = React.createRef<HTMLDivElement>();

  private dblClickHandler: React.MouseEventHandler<HTMLDivElement> = _e => {
    this.props.onEdit(this.props.box.id);
  };

  private dragStart: DraggableEventHandler = (_e, { x, y }) => {
    // We end up in here always on mousedown
    const { startUndoGroup } = this.props;
    this.dragState = {
      initialPosition: [x, y],
      startedAt: Date.now(),
    };
    startUndoGroup();
    setTimeout(this.possiblyMakeRipples, longPressDuration + 20);
  };


  private dragEnd: DraggableEventHandler = (e, d) => {
    const { wasDragging, isLongPress } = this.dragStats();
    this.dragState = undefined;

    if (!wasDragging) {
      if (!isLongPress) {
        this.onSelect();
      }
    } else {
      this.endDragSimulation();
      if (this.props.connectMode) {
        this.endConnecting(e, d);
      }
    }
    // Commit all the drag-induced changes
    this.props.stopUndoGroup();
  };

  possiblyMakeRipples = () => {
    const { wasDragging, isLongPress } = this.dragStats();
    if (!wasDragging && isLongPress) {
      this.props.onDeepEdit(this.props.box.id);
    }
  };

  private dragStats() {
    let wasDragging = false;
    let pressedFor = 0;
    let isLongPress = false;
    if (this.dragState) {
      const {
        initialPosition: start,
        latestPosition: end,
        startedAt: started,
      } = this.dragState;
      if (end) {
        wasDragging = didItMove(start, end);
      }
      pressedFor = Date.now() - started;
      if (pressedFor > longPressDuration) {
        isLongPress = true;
      }
    }
    return {
      wasDragging,
      pressedFor,
      isLongPress,
    };
  }


  private initDragSimulation() {
    const {
      box: { id },
      simulation,
    } = this.props;
    if (!simulation) {
      return;
    }
    let node = this.simulationNode;
    if (!node || node.id !== id) {
      this.simulationNode = node = simulation.nodes().find(n => n.id === id);
    }
    console.log('initdragsimulation');
    if (node) {
      simulation.alphaTarget(0.4).restart();
      const { x, y } = node;
      node.fx = x;
      node.fy = y;
    }
  }

  private endDragSimulation() {
    const { simulation } = this.props;
    if (!simulation) {
      return;
    }
    const node = this.simulationNode;
    if (node) {
      console.log('enddragsimulation');

      simulation.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    }
  }

  private updateDragSimulation(deltaX: number, deltaY: number, scale: number) {
    const { simulation } = this.props;
    if (!simulation) {
      return;
    }
    const node = this.simulationNode;
    if (node) {
      console.log('updtedragsimulation');

      node.fx =
        (typeof node.fx === 'number' ? node.fx : node.x)! + deltaX / scale;
      node.fy =
        (typeof node.fy === 'number' ? node.fy : node.y)! + deltaY / scale;
      // console.log(x / scale, y / scale);
    }
  }

  private move: DraggableEventHandler = (e, d) => {
    const { deltaX, deltaY, x, y } = d;
    const { box, zoomTransform, simulation, connectMode } = this.props;
    if (this.dragState) {
      if (!this.dragState.latestPosition) {
        // the first time after pressing down
        if (connectMode) {
          this.startConnecting(e, d);
        } else if (simulation) {
          this.initDragSimulation();
        }
      }
      this.dragState.latestPosition = [x, y];
    }
    const { k: scale } = zoomTransform();
    if (connectMode) {
      this.updateConnecting(e, d);
    } else if (simulation) {
      this.updateDragSimulation(deltaX, deltaY, scale);
    } else {
      box.move(deltaX / scale, deltaY / scale);
    }
  };

  private startConnecting: DraggableEventHandler = (_e, { x, y }) => {
    const { box, startConnecting, zoomTransform } = this.props;
    const { k: scale } = zoomTransform();
    startConnecting(box, [x / scale, y / scale]);
  };

  private updateConnecting: DraggableEventHandler = (_e, { x, y }) => {
    const { updateConnecting, zoomTransform } = this.props;
    const { k: scale } = zoomTransform();
    updateConnecting([x / scale, y / scale]);
  };

  private endConnecting: DraggableEventHandler = () => {
    const { endConnecting } = this.props;
    endConnecting();
  };

  private onSelect = () => {
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
    const { withoutUndo, measureHeight, measureWidth } = this.props;
    if (!ref || (!measureWidth && !measureHeight)) {
      return;
    }
    const { offsetWidth, offsetHeight } = ref;
    const dW = width - offsetWidth;
    const dH = height - offsetHeight;
    if (dW && dH && measureWidth && measureHeight) {
      console.log('measured');
      withoutUndo(() => setDimensions(offsetWidth, offsetHeight));
    } else if (dW && measureWidth) {
      console.log('measured');
      withoutUndo(() => setWidth(offsetWidth));
    } else if (dH && measureHeight) {
      console.log('measured');
      withoutUndo(() => setHeight(dH));
    }
  }

  public render() {
    const { selected, children } = this.props;
    const child = React.cloneElement(React.Children.only(children), {
      onDoubleClick: this.dblClickHandler,
      ref: this.boxRef,
      selected,
    });
    return (
      <DraggableNode
        onDrag={this.move}
        onStart={this.dragStart}
        onStop={this.dragEnd}
      >
        {child}
      </DraggableNode>
    );
  }
}

export const NodeView = connect<Props>((store, props) => ({
  ...props,
  selected: store.selection === props.box.id,
  onSelect: store.select,
  onEdit: store.setEditing,
  onDeepEdit: store.setDeepEditing,
  connectMode: store.tool === TOOL_CONNECT,
  startConnecting: store.startConnecting,
  updateConnecting: store.updateConnecting,
  endConnecting: store.endConnecting,
  withoutUndo: store.undoManager.withoutUndo,
  startUndoGroup: store.undoManager.startGroup,
  stopUndoGroup: store.undoManager.stopGroup,
  simulation: store.simulation,
  zoomTransform: store.getZoomTransform,
}))(observer(NodeViewBase));
