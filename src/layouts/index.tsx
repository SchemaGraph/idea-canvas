import * as React from 'react';
import Helmet from 'react-helmet';
import styled, { ThemeProvider } from 'styled-components';

const MainDiv = styled.div`
  height: 100%;
  /* display: flex; */
  position: relative;
  overflow: hidden;
`;

interface Props {
  location?: Location;
}

function getTitle(location?: Location) {
  if (!location || !location.pathname) {
    return null;
  }
  const { pathname } = location;
  const stripped = pathname.replace(/^\//, '');
  const pathSections = stripped.split('/');
  if (pathname === '/' || pathSections.length > 1) {
    return null;
  }
  const title = stripped
    .split(/[-|]/)
    .map(p => p.substr(0, 1).toUpperCase() + p.substr(1))
    .join(' ');
  return <title>{title}</title>;
}
const MainLayout: React.SFC<Props> = ({ children, location }) => (
  <ThemeProvider theme={{}}>
    <MainDiv>
      <Helmet defaultTitle={`IdeaCanvas`} titleTemplate={`%s | IdeaCanvas`}>
        <meta name="og:type" content="website" />
        <meta name="og:site_name" content="IdeaCanvas" />
        <link
          rel="canonical"
          href={`https://idea-canvas.netlify.com/${location &&
            location.pathname}`}
        />
        {getTitle(location)}
        <html lang="en" />
      </Helmet>
      {children}
    </MainDiv>
  </ThemeProvider>
);

export default MainLayout;
