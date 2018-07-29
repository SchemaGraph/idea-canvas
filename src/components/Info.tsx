import * as React from 'react';
import styled from 'styled-components';
import { CloseIcon, InfoIcon } from './icons';

interface ContainerProps {
  show?: boolean;
}
const MainContainer = styled.div`
  display: flex;
  flex-flow: column;
  flex-shrink: 0;
  overflow: hidden;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 200px;
  padding: 0;
  background-color: transparent;
`;

const Container = styled.div`
  display: flex;
  flex-flow: column;
  flex-shrink: 0;
  transition: transform 0.3s ease-out;
  overflow: hidden;
  transform: ${({ show }: ContainerProps) =>
    `translate(${show ? 0 : '100%'}, 0)`};
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  /* width: 150px; */
  /* padding: 1rem; */
  background-color: rgba(255, 255, 255, 0.9);
  border: 0px solid red;
  z-index: 1;
`;
const IconContainer = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  padding: 1rem;
  visibility: ${({ show }: ContainerProps) => show ? 'visible' : 'hidden'};
`;
const TextContainer = styled.div`
  display: flex;
  font-size: 14px;
  padding: 1rem;
  overflow-y: auto;
`;

interface Props {
  className?: string;
}
interface State {
  visible: boolean;
}
export class Info extends React.Component<Props, State> {
  public readonly state = {
    visible: true,
  };
  // public async componentDidMount() {}

  // public componentDidUpdate(prevProps: Props) {}

  public closeHandler: (
    v: boolean
  ) => React.MouseEventHandler<SVGElement> = visible => _ => {
    this.setState({ visible });
  };

  public render() {
    const { visible } = this.state;
    return (
      <MainContainer>
        <IconContainer show={!visible}>
          <InfoIcon onClick={this.closeHandler(true)}/>
        </IconContainer>
        <Container show={visible}>
          <IconContainer show={true}>
            <CloseIcon onClick={this.closeHandler(false)} />
          </IconContainer>
          <TextContainer>
            <ol>
              <li>Add nodes by clicking on the canvas</li>
              <li>Type a label and accept with enter</li>
              <li>Modify the label by double-clicking on a node</li>
              <li>
                Add links by dragging from a connector dot to another connector
                dot
              </li>
              <li>Zoom with the scrollwheel</li>
              <li>Pan by dragging the canvas</li>
              <li>Select multiple nodes with shift + drag</li>
            </ol>
          </TextContainer>
        </Container>
      </MainContainer>
    );
  }
}
