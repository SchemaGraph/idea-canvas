// import { Authenticator, withAuthenticator } from 'aws-amplify-react';
import { CognitoAuth } from 'amazon-cognito-auth-js';
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
import { init, IStore } from '../store';
import '../styles.css';
import { getCognitoAuth, getToken } from '../utils/auth';

const dev = process.env.NODE_ENV !== 'production';
// init('yebba4', dev);

interface State {
  store?: IStore;
  auth?: CognitoAuth;
}
export default class App extends React.Component<{}, State> {

  state: State = {
  };

  async componentDidMount() {
    const auth = getCognitoAuth();
    // This is only available (from localStorage) if we have logged in previously
    const token = getToken(auth);

    if (!token) {
      // redirects to the login page as a side-effect :/
      auth.getSession();
      return;
    }
    // console.log('JWT', token);
    const { url, region, auth: authOptions } = AppSyncConf({
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => token,
    });
    const client = getApolloClient(url, region, authOptions);
    const {store} = await init(client, 'yebba4', dev);
    this.setState({store, auth});
  }


  handleSignout = () => {
    const {auth} = this.state;
    if (auth) {
      // also redirects
      auth.signOut();
    }
  };

  render() {
    const {store} = this.state;
    if (!store) {
      return <Layout/>;
    }
    return (
      <Provider store={store}>
        <Layout>
          <Toolbar onSignOut={this.handleSignout}/>
          <Canvas />
          {/* <Info/> */}
          {dev && <DevTools />}
        </Layout>
      </Provider>
    );
  }
}
