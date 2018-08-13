import { CognitoAuth } from 'amazon-cognito-auth-js';
import { AUTH_TYPE } from 'aws-appsync';
import * as React from 'react';
import { getApolloClient } from '../appsync/client';
import { AppSyncConf } from '../appsync/config';
import { initStore, IStore, load } from '../store';
import { App } from './app';

interface Props {
  graphId: string;
  auth: CognitoAuth;
  token: string;
}

interface State {
  store?: IStore;
}
const dev = process.env.NODE_ENV !== 'production';

// tslint:disable-next-line:max-classes-per-file
export class ConnectedApp extends React.Component<Props, State> {
  constructor(p: Readonly<Props>) {
    super(p);
    console.log('CONSTRUCTOR');
  }
  state: State = {};

  async componentDidMount() {
    const { graphId, auth, token } = this.props;
    const store = initStore();
    const { url, region, auth: authOptions } = AppSyncConf({
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => token,
    });
    const client = getApolloClient(url, region, authOptions);
    await load(store, graphId!, client, dev);
    this.setState({ store });
  }
  render() {
    let { store } = this.state;
    const {auth} = this.props;
    const { graphId } = this.props;
    console.log('GRAPH', graphId);
    if (!store && !graphId) {
      store = initStore();
    }
    console.log('STORE', store);
    if (!store) {
      return null;
    }
    return <App store={store} auth={auth} />;
  }
}
