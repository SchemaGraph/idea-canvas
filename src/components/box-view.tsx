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
  onSelect?: (id: string) => void;
  selected?: boolean;
  onEditing?: (id: string | null) => void;
  editing?: boolean;
}
interface State {
  label?: string;
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
function getScaleStyle(top: number, left: number) {
  return { transform: `translate(${left}px,${top}px)` };
}

function getStyle(
  box: IBox,
  prevX?: number,
  prevY?: number,
  isDragging?: boolean
): React.CSSProperties {
  const { y, x, initialized, width } = box;
  return {
    ...getScaleStyle(y, x),
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
  prevX?: number;
  prevY?: number;
  dragStart?: number;

  public state: State = {
    label: undefined,
    dragStart: 0,
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

  public finishLabelEditing() {
    const { label } = this.state;
    const {
      onEditing,
      box: { setName, initialized, initialize },
    } = this.props;
    onEditing!(null);

    if (!initialized) {
      initialize(label);
    } else if (label) {
      setName(label);
    }
  }

  public onBlurHandler: React.FocusEventHandler<HTMLInputElement> = _e => {
    this.finishLabelEditing();
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
    this.props.setIsDragging!(this.props.box.id);
    this.dragStart = Math.hypot(x, y);
  };
  public stop: DraggableEventHandler = (_e, { x, y }) => {
    this.props.setIsDragging!();
    if (this.dragStart) {
      const d = Math.abs(this.dragStart - Math.hypot(x, y));
      // console.log('BOX MOVE END', d);
      if (d < 0.001) {
        this.select();
      }
      this.dragStart = undefined;
    }
  };

  public move: DraggableEventHandler = (_e, { deltaX, deltaY }) => {
    const { scale } = this.props.zoom;
    this.props.box.move(deltaX / scale, deltaY / scale);
  };

  select = () => {
    const {
      selected,
      onSelect,
      box: { id },
    } = this.props;
    if (!selected) {
      onSelect!(id);
    }
    // e.stopPropagation();
  };

  public componentDidMount() {
    const { editing } = this.props;
    if (editing && this.inputRef.current) {
      this.inputRef.current.focus();
    }
    this.measure();
  }

  public componentDidUpdate() {
    const { editing } = this.props;
    if (editing && this.inputRef.current) {
      this.inputRef.current.focus();
    }
    this.measure();
  }

  public measure() {
    const ref = this.boxRef.current;
    const {
      width,
      height,
      setDimensions,
      setWidth,
      setHeight,
      initialized,
      x,
      y,
    } = this.props.box;
    // console.log('MAYBE MEASURING');
    if (ref && initialized && !this.props.editing) {
      // Don't measure if not initialized
      const { clientWidth, clientHeight } = ref;
      // console.log('MEASURED', clientWidth, clientHeight);
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
    this.prevX = x;
    this.prevY = y;
  }

  public render() {
    const { box, selected, editing } = this.props;
    const { label } = this.state;

    const input = (
      <LabelInput
        type="text"
        value={label || box.name || ''}
        innerRef={this.inputRef}
        onChange={this.onChangeHandler}
        onBlur={this.onBlurHandler}
        onKeyUp={this.onKeyPressHandler}
      />
    );

    const { name } = box;
    // const { offsetX, offsetY, scale } = zoom;

    return (
      <DraggableCore onDrag={this.move} onStart={this.start} onStop={this.stop}>
        <BoxDiv
          innerRef={this.boxRef}
          style={getStyle(box, this.prevX, this.prevY, !!this.dragStart)}
          selected={!!selected}
          onDoubleClick={this.dblClickHandler}
        >
          <Label editing={editing}>{name || `\xa0`}</Label>
          {editing ? input : null}
        </BoxDiv>
      </DraggableCore>
    );
  }
}

export const BoxView = connect<Props>((store, { box, zoom }) => ({
  zoom,
  box,
  onSelect: store.select,
  onEditing: store.setEditing,
  selected: store.selection === box.id,
  editing: store.editing === box.id,
  setIsDragging: store.setDragging,
}))(observer(BoxViewVanilla));
