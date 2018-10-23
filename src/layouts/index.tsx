import * as React from 'react';
import Helmet from 'react-helmet';
import { injectGlobal, ThemeProvider } from 'styled-components';
import { global, Root, theme } from '../theme/theme';
import { FocusStyleManager } from '@blueprintjs/core';

FocusStyleManager.onlyShowFocusOnTabs();
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
  <ThemeProvider theme={theme}>
    <Root className="bp3-dark">
      <Helmet
        defaultTitle={`IdeaCanvas`}
        titleTemplate={`%s | IdeaCanvas`}
        bodyAttributes={{
          class: 'bp3-dark',
        }}
      >
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
    </Root>
  </ThemeProvider>
);
injectGlobal`
  ${global}
`;
FocusStyleManager.onlyShowFocusOnTabs();
export default MainLayout;
