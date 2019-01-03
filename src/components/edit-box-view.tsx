import { easeExp } from 'd3-ease';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Animate } from 'react-move';
import styled, { OuterStyledProps } from 'styled-components';
import { INITIAL_BOX_ID } from '../models/store';
import { connect } from '../utils';
import { IBox } from '../models/models';

interface Props {
  box: IBox;
  submit: (name: string) => void;
  discard: () => void;
}
interface State {
  label?: string;
}

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
  font-size: 16px;
`;

function getStyle(
  { x, y, width }: IBox,
  opacity = 1
): React.CSSProperties {
  return {
    transform: `translate(${x}px,${y}px)`,
    opacity,
    width,
  };
}

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

  static defaultProps = {
    submit: () => {},
    discard: () => {},
  }
  private inputRef = React.createRef<HTMLInputElement>();
  private boxRef = React.createRef<HTMLDivElement>();

  public state: State = {
    label: undefined,
  };

  constructor(props: Props) {
    super(props);
  }

  public onChangeHandler: React.ChangeEventHandler<HTMLInputElement> = e => {
    this.setState({ label: e.target.value });
  };

  public finishLabelEditing = () => {
    if (this.state.label) {
      this.props.submit(this.state.label);
    } else {
      this.props.discard();
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
    if (e.key === 'Enter') {
      this.finishLabelEditing();
    }
    if (e.key === 'Escape') {
      this.props.discard();
    }
  };

  public componentDidMount() {
    const { box } = this.props;
    this.setState({
      label: box.name,
    });
    if (this.inputRef.current) {
      return this.inputRef.current.focus();
    }
  }

  public componentDidUpdate() {
    if (this.inputRef.current) {
      return this.inputRef.current.focus();
    }
  }

  public render() {
    const { box } = this.props;
    const { label } = this.state;

    return (
      <Animate
        start={{ opacity: 0 }}
        enter={{
          opacity: [1],
          timing: { duration: 200 },
          easing: easeExp,
        }}
      >
        {({ opacity }) => (
          <BoxDiv
            innerRef={this.boxRef}
            style={getStyle(box, opacity as number)}
          >
            {`\xa0`}
            <LabelInput
              type="text"
              value={label || ''}
              innerRef={this.inputRef}
              onChange={this.onChangeHandler}
              onBlur={this.onBlurHandler}
              onKeyUp={this.onKeyPressHandler}
            />
          </BoxDiv>
        )}
      </Animate>
    );
  }
}

export const EditBoxView = connect<Props>((store, { box }) => ({
  box,
  submit: (name: string) => {
    if (box.id === INITIAL_BOX_ID) {
      store.commitBox(name);
    } else {
      box.setName(name);
      store.setEditing(null);
    }
  },
  discard: () => store.setEditing(null),
}))(observer(BoxViewVanilla));
