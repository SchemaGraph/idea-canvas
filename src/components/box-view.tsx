import { observer } from 'mobx-react';
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import styled, { OuterStyledProps } from 'styled-components';
import { Zoom } from '../store';
import { colors, fadedAlpha } from '../theme/theme';
import { connect } from '../utils';
import { IBox } from './models';

interface Props {
  box: IBox;
  zoom: Zoom;
  setIsDragging?: (boxId?: string) => void;
}
interface State {
  label?: string;
  editing: boolean;
  prevEditing: boolean;
  dragStart: number;
}

interface BoxDivProps {
  selected: boolean;
}
const BoxDiv = styled.div`
  border: 2px solid white;
  padding: 16px;
  position: absolute;
  border-radius: 8px;
  background-color: ${({ selected }: BoxDivProps) =>
    (selected ? colors.orange : colors.blue).alpha(fadedAlpha).toString()};
  cursor: pointer;
  color: white;
  white-space: nowrap;
  -webkit-touch-callout: none;
  user-select: none;
  transform-origin: 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  /* height: 60px; */
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  /* min-width: 80px; */
  touch-action: none;
  /* transition: transform 0.2s ease-out; */
`;
function getScaleStyle(_z: Zoom, top: number, left: number) {
  return { transform: `translate(${left}px,${top}px)` };
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

  public state: State = {
    label: undefined,
    editing: false,
    prevEditing: false,
    dragStart: 0,
  };

  constructor(props: Props) {
    super(props);
  }

  public dblClickHandler: React.MouseEventHandler<HTMLDivElement> = _e => {
    this.setState({
      ...this.state,
      editing: true,
    });
  };

  public onChangeHandler: React.ChangeEventHandler<HTMLInputElement> = e => {
    this.setState({
      ...this.state,
      label: e.target.value,
      prevEditing: true,
    });
  };

  public finishLabelEditing() {
    const { label } = this.state;
    const { box } = this.props;
    this.setState({
      ...this.state,
      editing: false,
      prevEditing: false,
    });
    if (label) {
      box.setName(label);
    }
  }

  public onBlurHandler: React.FocusEventHandler<HTMLInputElement> = _e => {
    this.finishLabelEditing();
  };

  public onKeyPressHandler: React.KeyboardEventHandler<
    HTMLInputElement
  > = e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      this.finishLabelEditing();
    }
  };

  public start: DraggableEventHandler = (_e, { x, y }) => {
    // console.log('BOX MOVE START', this.state.dragStart);
    // e.stopPropagation();
    // e.stopImmediatePropagation();
    // e.preventDefault();
    this.props.setIsDragging!(this.props.box.id);
    this.setState({
      ...this.state,
      dragStart: Math.hypot(x, y),
    });
  };
  public stop: DraggableEventHandler = (_e, { x, y }) => {
    const d = Math.abs(this.state.dragStart - Math.hypot(x, y));
    // console.log('BOX MOVE END', d);
    if (d < 0.001) {
      this.select();
    }
  };

  public move: DraggableEventHandler = (
    e,
    { deltaX, deltaY, x, y, lastX, lastY }
  ) => {
    // console.log('BOX MOVE', this.state.dragStart, x, y, lastX, lastY);
    // e.stopPropagation();
    // e.stopImmediatePropagation();
    // e.preventDefault();
    const { scale } = this.props.zoom;
    this.props.box.move(deltaX / scale, deltaY / scale);
    // this.setState({
    //   ...this.state,
    //   dragStart: Math.hypot(deltaX, deltaY),
    // });
  };

  select = () => {
    const { box } = this.props;
    if (!box.selected) {
      box.setSelected(true);
    }
    // e.stopPropagation();
  };

  public componentDidMount() {
    const { box } = this.props;
    const { editing } = this.state;
    if (editing && this.inputRef.current) {
      this.inputRef.current.focus();
    }
    if (!editing && box.name === '') {
      this.setState({
        ...this.state,
        editing: true,
      });
    }
    this.measure();
  }

  public componentDidUpdate() {
    const { editing, prevEditing } = this.state;
    if (editing && !prevEditing && this.inputRef.current) {
      this.inputRef.current.focus();
    }
    this.measure();
  }

  public measure() {
    const b = this.boxRef.current;
    const {
      width,
      height,
      setDimensions,
      setWidth,
      setHeight,
    } = this.props.box;
    if (b) {
      const { clientWidth, clientHeight } = b;
      const dW = width - clientWidth;
      const dH = height - clientHeight;
      if (dW && dH) {
        setDimensions(clientWidth, clientHeight);
      } else if (dW) {
        setWidth(clientWidth);
      } else if (dH) {
        setHeight(dH);
      }
    }
  }

  public render() {
    const { box, zoom } = this.props;
    const { editing, label } = this.state;

    const input = (
      <LabelInput
        type="text"
        value={label || box.name}
        innerRef={this.inputRef}
        onChange={this.onChangeHandler}
        onBlur={this.onBlurHandler}
        onKeyUp={this.onKeyPressHandler}
      />
    );

    const { y: top, x: left, selected, name } = box;
    // const { offsetX, offsetY, scale } = zoom;

    return (
      <DraggableCore onDrag={this.move} onStart={this.start} onStop={this.stop}>
        <BoxDiv
          innerRef={this.boxRef}
          style={getScaleStyle(zoom, top, left)}
          selected={selected}
          onDoubleClick={this.dblClickHandler}
        >
          <Label editing={editing}>{name}</Label>
          {editing ? input : null}
        </BoxDiv>
      </DraggableCore>
    );
  }
}

export const BoxView = connect<Props>((store, props) => ({
  ...props,
  setIsDragging: store.setDragging,
}))(observer(BoxViewVanilla));
