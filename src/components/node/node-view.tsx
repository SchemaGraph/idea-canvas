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

class NodeViewBase extends React.Component<Props> {
  public static defaultProps: Partial<Props> = {
    onSelect: emptyFn,
    onEdit: emptyFn,
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

  private simulationNode: SimulationNode | undefined;
  private boxRef = React.createRef<HTMLDivElement>();

  private dblClickHandler: React.MouseEventHandler<HTMLDivElement> = _e => {
    this.props.onEdit(this.props.box.id);
  };

  private dragStart: DraggableEventHandler = () => {
    const {
      box: { id },
      simulation,
      startUndoGroup,
    } = this.props;

    if (simulation) {
      let node = this.simulationNode;
      if (!node || node.id !== id) {
        this.simulationNode = node = simulation.nodes().find(n => n.id === id);
      }
      if (node) {
        // console.log(node, simulation);
        // startUndoGroup();
        simulation.alphaTarget(0.4).restart();
        const { x, y } = node;
        node.fx = x;
        node.fy = y;
      }
    }
  };

  private dragEnd: DraggableEventHandler = () => {
    const {
      box: { id },
      simulation,
    } = this.props;
    if (simulation) {
      const node = this.simulationNode;
      if (node) {
        // console.log('dragend');
        simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
      }
    }
  };

  private move: DraggableEventHandler = (_e, { deltaX, deltaY, x, y }) => {
    const {
      box,
      zoomTransform,
      simulation,
    } = this.props;
    const {k: scale} = zoomTransform();
    if (simulation) {
      const node = this.simulationNode;
      if (node) {
        node.fx =
          (typeof node.fx === 'number' ? node.fx : node.x)! + deltaX / scale;
        node.fy =
          (typeof node.fy === 'number' ? node.fy : node.y)! + deltaY / scale;
        // console.log(x / scale, y / scale);
      }
    } else {
      box.move(deltaX / scale, deltaY / scale);
    }
  };

  private startConnecting: DraggableEventHandler = (_e, { x, y }) => {
    const {
      box,
      startConnecting,
      zoomTransform,
    } = this.props;
    const {k: scale} = zoomTransform();
    startConnecting(box, [x / scale, y / scale]);
  };

  private updateConnecting: DraggableEventHandler = (_e, { x, y }) => {
    const {
      updateConnecting,
      zoomTransform,
    } = this.props;
    const {k: scale} = zoomTransform();
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
    const { connectMode, selected, children } = this.props;
    const child = React.cloneElement(React.Children.only(children), {
      onDoubleClick: this.dblClickHandler,
      ref: this.boxRef,
      selected,
    });
    if (connectMode) {
      return (
        <DraggableNode
          onDrag={this.updateConnecting}
          onStart={this.startConnecting}
          onStop={this.endConnecting}
        >
          {child}
        </DraggableNode>
      );
    }
    return (
      <DraggableNode
        onDrag={this.move}
        onClick={this.onSelect}
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
