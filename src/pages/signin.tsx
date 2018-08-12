import * as React from 'react';
import { getCognitoAuth } from '../utils/auth';

interface State {
  error?: string;
}
export default class Signin extends React.Component<{}, State> {
  state: State = {};
  componentDidMount() {
    const auth = getCognitoAuth();
    const location = window.location;
    auth.userhandler = {
      // user signed in
      onSuccess: result => {
        console.log('cognitoauth signin succes', result);
        location.replace('/');
      },
      onFailure: err => {
        console.log('cognitoauth signin failure', err);
        this.setState({ error: err });
      },
    };
    auth.parseCognitoWebResponse(location.href);
  }

  render() {
    return <div>{this.state.error}</div>;
  }
}
