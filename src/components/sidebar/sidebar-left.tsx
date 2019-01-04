import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/theme';
import { connect } from '../../utils';
import { SourceCode } from './source-code';
import { observer } from 'mobx-react-lite';
import { IStore } from '../../models/store';

const Container = styled.div`
  height: 100%;
  overflow: hidden;
  width: 200px;
  padding: 0;
  background-color: ${colors.blue.darken(0.15).string()};
  hyphens: auto;
  border: 0px solid orange;
  flex: 0 0 auto;
  position: relative;
  color: white;
  box-shadow: inset 1px 1px 5px rgba(0, 0, 0, 0.2);
`;

interface Props {
  store?: IStore;
}

const SidebarLeftBase: React.FunctionComponent<Props> = ({ store }) => {
  if (!store) {
    return null;
  }
  return (
    <Container>
      <SourceCode />
    </Container>
  );
};

export const SidebarLeft = connect<Props>((store, _) => ({
  store,
}))(observer(SidebarLeftBase));
