import * as React from 'react';
import styled from 'styled-components';
import { rippleAnimation, rippleStyles } from '../theme/theme';

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  ${rippleStyles} &::after {
    animation: ${rippleAnimation}
      ${({ duration }: { duration: number }) => duration}ms ease-out;
  }
`;

interface Props {
  duration: number;
}

interface State {
  show: boolean;
}
export class Ripple extends React.Component<Props, State> {
  state = {
    show: false,
  };

  ripple() {
    this.setState({ show: true });
    setTimeout(() => this.setState({ show: false }), this.props.duration);
  }

  render() {
    return this.state.show ? (
      <Container duration={this.props.duration} />
    ) : null;
  }
}
