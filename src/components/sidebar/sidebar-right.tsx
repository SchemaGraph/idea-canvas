import * as React from 'react';
import styled from 'styled-components';
import { Tabs, Tab, Icon, Button, Divider } from '@blueprintjs/core';
import { colors, mobileOnly } from '../../theme/theme';
import { connect } from '../../utils';
import { Properties } from './properties-form';
import { SourceCode } from './source-code';
import { AppProperties } from './app-properties-form';
interface ContainerProps {
  show?: boolean;
}
const SidebarContainer = styled.div`
  height: 100%;
  overflow: hidden;
  width: 200px;
  padding: 1rem;
  background-color: ${colors.blue.darken(0.15).string()};
  transform: ${({ show }: ContainerProps) => `translate(${show ? 0 : '0'}, 0)`};
  hyphens: auto;
  border: 0px solid orange;
  flex: 0 0 auto;
  position: relative;
  color: white;
  box-shadow: inset 1px 1px 5px rgba(0, 0, 0, 0.2);
`;
const SidebarDivider = styled.div`
  position: absolute;
  left: 0;
  top: 2rem;
  bottom: 2rem;
  /* height: calc(100% - 2rem); */
  /* border-left: 1px solid rgba(0, 0, 0, 0.2); */
`;

interface Props {
  visible?: boolean;
  setVisibility?: (v: boolean) => void;
  selection?: string | null;
}
class SidebarBase extends React.Component<Props> {
  public render() {
    // if (!this.props.visible) {
    //   console.log(this.props);
    //   return null;
    // }
    // console.log(this.props);
    const { selection } = this.props;
    const selected = selection ? 'properties' : 'properties';
    return (
      <SidebarContainer>
        <SidebarDivider />
        <Tabs animate={false} id="sidebar" defaultSelectedTabId={selected}>
          <Tab
            id="properties"
            title={<Icon icon="settings" />}
            panel={
              selection ? <Properties id={selection} /> : <AppProperties />
            }
          />
          {/* <Tab id="info" title={<Icon icon="info-sign" />} /> */}
        </Tabs>
      </SidebarContainer>
    );
  }
}

export const Sidebar = connect<Props>((store, _) => ({
  visible: !store.isMobile,
  setVisibility: store.setSidebarVisibility,
  selection: store.selection,
}))(SidebarBase);

interface MainbarProps {
  showSidebar?: boolean;
  setSidebarVisibility?: (v: boolean) => void;
  className?: string;
}

const MainbarBase = styled.div`
  flex: ${(p: MainbarProps) => `1 0 ${p.showSidebar ? 'auto' : '100%'}`};
  width: auto !important; /* we set this to fight the splitter.js setting a width */
  border: 0px solid red;
  overflow: hidden;
  position: relative;
  ${mobileOnly`
      flex: 1 0 100%;
    `};
`;

export const Mainbar = connect((store, _) => ({
  showSidebar: !store.isMobile,
  setSidebarVisibility: store.setSidebarVisibility,
}))(MainbarBase);

const MenuButtonBase = (p: MainbarProps) => {
  const handler = () => p.setSidebarVisibility!(!p.showSidebar!);
  return (
    <Button
      className={p.className}
      icon="menu"
      large
      minimal
      onClick={handler}
    />
  );
};

export const MenuButton = connect((store, _) => ({
  showSidebar: store.showSidebar,
  setSidebarVisibility: store.setSidebarVisibility,
}))(MenuButtonBase);
