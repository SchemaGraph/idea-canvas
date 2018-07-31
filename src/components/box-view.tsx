import Color from 'color';
import { observer } from 'mobx-react';
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import styled, { OuterStyledProps } from 'styled-components';
import { Zoom } from '../store';
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
}

interface BoxDivProps {
  selected: boolean;
}
const colors = ['#2d3e4e', '#f99b1d'].map(c =>
  Color(c)
    .alpha(0.9)
    .toString()
);
const BoxDiv = styled.div`
  border: 2px solid white;
  position: absolute;
  border-radius: 8px;
  background-color: ${({ selected }: BoxDivProps) => colors[+selected]};
  cursor: pointer;
  color: white;
  white-space: nowrap;
  -webkit-touch-callout: none;
  user-select: none;
  transform-origin: 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  min-width: 80px;
  touch-action: none;
`;
function getScaleStyle(z: Zoom) {
  const { offsetX, offsetY, scale } = z;
  return {
    transform: `translate(${offsetX / scale}px,${offsetY / scale}px)`,
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

const LabelInput = (
  props: OuterStyledProps<React.InputHTMLAttributes<HTMLInputElement>>
) => {
  return <Input type="text" {...props} />;
};
const Input = styled.input`
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
  public state: State = {
    label: undefined,
    editing: false,
    prevEditing: false,
  };

  public input?: HTMLInputElement;

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
    if (e.key === 'Enter') {
      this.finishLabelEditing();
    }
    if (e.keyCode === 8) {
      e.stopPropagation();
      // e.preventDefault();
    }
    // console.log(e.keyCode);
  };

  public start: DraggableEventHandler = e => {
    // console.log('BOX MOVE START');
    // e.stopPropagation();
    // e.stopImmediatePropagation();
    // e.preventDefault();
    this.props.setIsDragging!(this.props.box.id);
  };
  public stop: DraggableEventHandler = _e => {
    // console.log('BOX MOVE END');
    this.props.setIsDragging!();
  };

  public move: DraggableEventHandler = (e, { deltaX, deltaY }) => {
    // console.log('BOX MOVE');
    // e.stopPropagation();
    // e.stopImmediatePropagation();
    // e.preventDefault();
    const { scale } = this.props.zoom;
    this.props.box.move(deltaX / scale, deltaY / scale);
  };
  public select: React.MouseEventHandler = e => {
    const { box } = this.props;
    if (!box.selected) {
      box.setSelected(true);
    }
    e.stopPropagation();
  };

  public refSetter = (input: HTMLInputElement) => {
    this.input = input;
  };

  public componentDidMount() {
    const { box } = this.props;
    const { editing } = this.state;
    if (editing && this.input) {
      this.input.focus();
    }
    if (!editing && box.name === '') {
      this.setState({
        ...this.state,
        editing: true,
      });
    }
  }

  public componentDidUpdate() {
    const { editing, prevEditing } = this.state;
    if (editing && !prevEditing && this.input) {
      this.input.focus();
    }
  }

  public render() {
    const { box, zoom } = this.props;
    const { editing, label } = this.state;

    const input = (
      <LabelInput
        type="text"
        value={label || box.name}
        innerRef={this.refSetter}
        onChange={this.onChangeHandler}
        onBlur={this.onBlurHandler}
        onKeyDown={this.onKeyPressHandler}
      />
    );

    const { width, y: top, x: left, selected, name } = box;
    // const { offsetX, offsetY, scale } = zoom;

    return (
      <DraggableCore onDrag={this.move} onStart={this.start} onStop={this.stop}>
        <BoxDiv
          style={{
            width,
            top,
            left,
            ...getScaleStyle(zoom),
          }}
          selected={selected}
          onClick={this.select}
          onDoubleClick={this.dblClickHandler}
        >
          {editing ? input : <Label>{name}</Label>}
        </BoxDiv>
      </DraggableCore>
    );
  }
}

export const BoxView = connect<Props>((store, props) => ({
  ...props,
  setIsDragging: store.setDragging,
}))(observer(BoxViewVanilla));
