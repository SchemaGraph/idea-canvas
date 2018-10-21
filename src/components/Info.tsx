import * as React from 'react';
import styled from 'styled-components';
import { CloseIcon, InfoIcon } from './icons';
import IconCursor from './toolbar/icon-cursor';
import IconFit from './toolbar/icon-fit';
import IconPan from './toolbar/icon-pan';
import IconPlus from './toolbar/icon-plus';
import IconConnect from './toolbar/icon-plus-arrow';
import IconRemove from './toolbar/icon-remove';
import IconSignout from './toolbar/icon-signout';

interface ContainerProps {
  show?: boolean;
}
const MainContainer = styled.div`
  display: flex;
  flex-flow: column;
  flex-shrink: 0;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 250px;
  padding: 0;
  background-color: transparent;
  transform: ${({ show }: ContainerProps) =>
    `translate(${show ? 0 : '100%'}, 0)`};
  hyphens: auto;
`;

const Container = styled.div`
  display: flex;
  flex-flow: column;
  flex-shrink: 0;
  transition: transform 0.3s ease-out;
  overflow: hidden;
  right: 0;
  top: 0;
  height: 100%;
  /* width: 150px; */
  /* padding: 1rem; */
  background-color: rgba(19, 20, 22, 0.95);
  color: rgba(255, 255, 255, 0.8);
  border: 0px solid red;
  z-index: 1;
`;
const InfoIconContainer = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  position: absolute;
  top: 0;
  left: 0;
  padding: 5px;
  visibility: ${({ show }: ContainerProps) => (show ? 'visible' : 'hidden')};
  transform: ${({ show }: ContainerProps) =>
    `translate(${show ? '-100%' : 0}, 0)`};
`;
const CloseIconContainer = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: flex-end;
  flex-shrink: 0;
  padding: 1rem;
`;
const TextContainer = styled.div`
  display: flex;
  flex-flow: column;
  font-size: 14px;
  padding: 0rem;
  overflow-y: auto;
`;
const ToolExplanation = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  font-size: 14px;
  padding: 0 1rem 1rem 0;
`;
const ToolIcon = styled.div`
  margin: 0 1rem 0 1rem;
  width: 24px;
  height: 24px;
`;
const ToolDescription = styled.div`
  display: flex;
  font-size: 14px;
  padding: 0;
`;
const Header = styled.div`
  font-size: 14px;
  padding: 0 1rem 1rem 1rem;
`;
const Path = styled.span`
  font-family: 'Courier New', Courier, monospace;
`;

interface Props {
  className?: string;
}
interface State {
  visible: boolean;
}
export class Info extends React.Component<Props, State> {
  public readonly state = {
    visible: false,
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
      <MainContainer show={visible}>
        <InfoIconContainer show={!visible}>
          <InfoIcon onClick={this.closeHandler(true)} />
        </InfoIconContainer>
        <Container>
          <CloseIconContainer>
            <CloseIcon onClick={this.closeHandler(false)} />
          </CloseIconContainer>
          <TextContainer>
            <Header>
              Quickly sketch network graphs with named nodes and directed
              connections. If a graph name is chosen by navigating to e.g.
              <Path>/my&#8209;awesome&#8209;graph</Path>, a shared collaborative
              graph is created / loaded. Otherwise the graph is persisted only
              locally (i.e. it still survives reloads).
            </Header>
            <ToolExplanation>
              <ToolIcon>
                <IconCursor />
              </ToolIcon>
              <ToolDescription>
                Move nodes by dragging. Double click or long-press a node to
                edit its label.
              </ToolDescription>
            </ToolExplanation>
            <ToolExplanation>
              <ToolIcon>
                <IconPlus />
              </ToolIcon>
              <ToolDescription>
                Add a new node by clicking on the canvas.
              </ToolDescription>
            </ToolExplanation>
            <ToolExplanation>
              <ToolIcon>
                <IconConnect />
              </ToolIcon>
              <ToolDescription>
                Connect nodes by dragging a connector from one to the other.
              </ToolDescription>
            </ToolExplanation>
            <ToolExplanation>
              <ToolIcon>
                <IconRemove />
              </ToolIcon>
              <ToolDescription>
                Remove a node or connector by clicking / tapping.
              </ToolDescription>
            </ToolExplanation>
            <ToolExplanation>
              <ToolIcon>
                <IconFit />
              </ToolIcon>
              <ToolDescription>
                Restore the view to its original scale and position.
              </ToolDescription>
            </ToolExplanation>
            <ToolExplanation>
              <ToolIcon>
                <IconSignout />
              </ToolIcon>
              <ToolDescription>Sign out.</ToolDescription>
            </ToolExplanation>
          </TextContainer>
        </Container>
      </MainContainer>
    );
  }
}
