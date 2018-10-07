import { CognitoAuth } from 'amazon-cognito-auth-js';
import { AUTH_TYPE } from 'aws-appsync';
import * as React from 'react';
import { getApolloClient } from '../appsync/client';
import { AppSyncConf } from '../appsync/config';
import { initStore, IStore, remoteLoad } from '../store';
import { App } from './app';

interface Props {
  graphId: string;
  auth: CognitoAuth;
  token: string;
  location?: Location;
}

interface State {
  store?: IStore;
}
const dev = process.env.NODE_ENV !== 'production';

export class ConnectedApp extends React.Component<Props, State> {
  state: State = {};

  async componentDidMount() {
    const { graphId, auth, token } = this.props;
    const store = initStore();
    const { url, region, auth: authOptions } = AppSyncConf({
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => token,
    });
    const client = getApolloClient(url, region, authOptions);
    await remoteLoad(store, graphId!, client, dev);
    this.setState({ store });
  }
  render() {
    let { store } = this.state;
    const { auth } = this.props;
    const { graphId } = this.props;
    console.log('GRAPH', graphId);
    if (!store && !graphId) {
      store = initStore();
    }
    if (!store) {
      return null;
    }
    return <App store={store} auth={auth} location={location} undoredo={false} />;
  }
}
