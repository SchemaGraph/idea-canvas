// import { Authenticator, withAuthenticator } from 'aws-amplify-react';
import { AUTH_TYPE } from 'aws-appsync';
import { Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { AppSyncConf } from '../appsync/AppSync';
import { getApolloClient } from '../appsync/client';
import { Canvas } from '../components/canvas';
import { Toolbar } from '../components/toolbar';
import Layout from '../layouts';
// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import { init, store } from '../store';
import '../styles.css';
import { getCognitoAuth } from '../utils/auth';

const dev = process.env.NODE_ENV !== 'production';
// init('yebba4', dev);

const { url, region, auth } = AppSyncConf({
  type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
  jwtToken: async () => {
    const a = getCognitoAuth();
    const session = a.getSignInUserSession();
    const aToken = session.getAccessToken().jwtToken;
    const iToken = session.getIdToken().jwtToken;
    console.log(aToken, iToken);
    const token = !aToken || aToken === '' ? aToken : iToken;
    if (!token || token === '') {
      return null;
    }
    console.log('Apollo client JWT', token);
    return token;
  },
});
const client = getApolloClient(url, region, auth);
init(client, 'yebba4', dev);
export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Layout>
          <Toolbar />
          <Canvas />
          {/* <Info/> */}
          {dev && <DevTools />}
        </Layout>
      </Provider>
    );
  }
}
