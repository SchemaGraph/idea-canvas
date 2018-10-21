import { easeExp, easeExpOut } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { Animate } from 'react-move';
import styled, { OuterStyledProps } from 'styled-components';
import { Zoom } from '../store';
import { colors, fadedAlpha } from '../theme/theme';
import { connect } from '../utils';
import { P } from '../utils/vec';
import { IBox, IContext } from './models';
import { Ripple } from './ripple';
import { TOOL_CONNECT } from './toolbar/constants';

interface Props {
  box: IBox;
  zoom: Zoom;
  connect?: boolean;
  startConnecting: (from: IBox, to: P) => void;
  updateConnecting: (to: P) => void;
  endConnecting: () => void;
  setIsDragging?: (boxId?: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  onEditing?: (id: string | null) => void;
  editing?: boolean;
}
interface State {
  label?: string;
  connectorEnd?: [number, number];
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
`;

function getStyle(
  x: number,
  y: number,
  box: IBox,
  context?: IContext,
  opacity = 1,
  isDragging?: boolean
): React.CSSProperties {
  const { initialized, width } = box;
  return {
    transform: `translate(${x}px,${y}px)`,
    opacity,
    backgroundColor: context ? context.color : 'transparent',
    width: !initialized ? width : undefined,
    transition: !isDragging ? 'transform 0.2s ease-out' : undefined,
  };
}
interface LabelProps {
  editing?: boolean;
}
const Label = styled.div`
  display: inline-block;
  text-align: center;
  z-index: 1;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  font-size: 16px;
  visibility: ${({ editing }: LabelProps) => (editing ? 'hidden' : 'visible')};
`;

const LabelInput = (
  props: OuterStyledProps<React.InputHTMLAttributes<HTMLInputElement>>
) => {
  return <Input type="text" {...props} />;
};
const Input = styled.input`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
  width: 80%;
  z-index: 1;
  text-align: center;
  background-color: transparent;
  outline-style: none;
  box-shadow: none;
  border-color: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  font-size: 16px;
`;

class BoxViewVanilla extends React.Component<Props, State> {
  private inputRef = React.createRef<HTMLInputElement>();
  private boxRef = React.createRef<HTMLDivElement>();
  private ripple = React.createRef<Ripple>();
  private dragStart?: {
    initialPosition: { x: number; y: number };
    latestPosition?: { x: number; y: number };
    instant: number;
  };

  public state: State = {
    label: undefined,
  };

  constructor(props: Props) {
    super(props);
  }

  public dblClickHandler: React.MouseEventHandler<HTMLDivElement> = _e => {
    const {
      onEditing,
      box: { id },
    } = this.props;
    onEditing!(id);
  };

  public onChangeHandler: React.ChangeEventHandler<HTMLInputElement> = e => {
    this.setState({ label: e.target.value });
  };

  public finishLabelEditing = () => {
    const { label } = this.state;
    const {
      onEditing,
      box: { name, setName, initialized, initialize },
    } = this.props;
    onEditing!(null);

    if (!initialized) {
      initialize(label);
    } else if (label !== name) {
      setName(label);
    }
  };

  public onBlurHandler: React.FocusEventHandler<HTMLInputElement> = _e => {
    // we want to let the click-handlers run first
    setTimeout(this.finishLabelEditing, 100);
  };

  public onKeyPressHandler: React.KeyboardEventHandler<
    HTMLInputElement
  > = e => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === 'Esc') {
      this.finishLabelEditing();
    }
  };

  public start: DraggableEventHandler = (_e, { x, y }) => {
    const {
      box,
      setIsDragging,
      connect: connectTool,
      startConnecting,
      zoom: { scale },
    } = this.props;
    setIsDragging!(box.id);
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
    const { setIsDragging, connect: connectTool, endConnecting } = this.props;
    setIsDragging!();
    if (this.dragStart) {
      if (this.isItDragging() === false) {
        if (this.pressedFor() > longPressDuration) {
          const {
            onEditing,
            box: { id },
          } = this.props;
          onEditing!(id);
        } else {
          // it was just a click
          this.select();
        }
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
      zoom: { scale },
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
    onSelect!(id);
  };

  public componentDidMount() {
    const { editing, box } = this.props;
    this.setState({
      label: box.name,
    });
    if (editing && this.inputRef.current) {
      return this.inputRef.current.focus();
    }
    this.measure();
  }

  public componentDidUpdate() {
    const { editing } = this.props;
    if (editing && this.inputRef.current) {
      return this.inputRef.current.focus();
    }
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
      initialized,
    } = this.props.box;
    // console.log('MAYBE MEASURING');
    if (ref && initialized && !this.props.editing) {
      // Don't measure if not initialized
      const { offsetWidth, offsetHeight } = ref;
      // console.log('MEASURED', clientWidth, clientHeight);
      const dW = width - offsetWidth;
      const dH = height - offsetHeight;
      if (dW && dH) {
        setDimensions(offsetWidth, offsetHeight);
      } else if (dW) {
        setWidth(offsetWidth);
      } else if (dH) {
        setHeight(dH);
      }
    }
  }

  public render() {
    const { box, editing, selected } = this.props;
    const { label } = this.state;

    const input = (
      <LabelInput
        type="text"
        value={label || ''}
        innerRef={this.inputRef}
        onChange={this.onChangeHandler}
        onBlur={this.onBlurHandler}
        onKeyUp={this.onKeyPressHandler}
      />
    );

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
              selected={selected || false}
            >
              <Label editing={editing}>{name || `\xa0`}</Label>
              {editing ? input : null}
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
  selected: store.selection === box.id,
  editing: store.editing === box.id,
  setIsDragging: store.setDragging,
}))(observer(BoxViewVanilla as any));
