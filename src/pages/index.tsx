import { Router } from '@reach/router';
import { CognitoAuth } from 'amazon-cognito-auth-js';
import * as React from 'react';
import { App } from '../components/app';
import { initStore, localClear } from '../models/store';
import { getCognitoAuth, CognitoOptions } from '../utils/auth';
import { graphql } from 'gatsby';

// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import '../styles.css';

function replaceState(url: string, title?: string) {
  if (history) {
    history.replaceState({}, title || 'unknown', url);
  }
}

const LocalApp: React.SFC<{ auth: CognitoAuth; location?: Location }> = ({
  auth,
  location,
}) => {
  return (
    <App
      store={initStore(false)}
      auth={auth}
      undoredo={true}
      location={location}
      dev={false}
    />
  );
};

const NewLocalApp: React.SFC<{ auth: CognitoAuth; location?: Location }> = ({
  auth,
  location,
}) => {
  localClear();
  replaceState(`/`);
  return <LocalApp auth={auth} location={location} />;
};

export default ({
  data: {
    site: { siteMetadata },
  },
}: {
  data: {
    site: {
      siteMetadata: CognitoOptions;
    };
  };
}) => {
  const auth = getCognitoAuth(siteMetadata);
  return (
    <Router>
      <LocalApp auth={auth} path="/" />
      <NewLocalApp auth={auth} path="/action/new" />
    </Router>
  );
};

export const query = graphql`
  query {
    site {
      siteMetadata {
        cognitoDomain
        cognitoUserPoolClientId
        externalBaseUrl
      }
    }
  }
`;
