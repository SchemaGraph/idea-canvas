import * as React from 'react';
import styled, {ThemeProvider} from 'styled-components';

const MainDiv = styled.div`
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
`;

const MainLayout: React.SFC = ({ children }) => (
  <ThemeProvider theme={{}}>
    <MainDiv>
      {children}
    </MainDiv>
  </ThemeProvider>
);

export default MainLayout;
