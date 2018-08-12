import * as React from 'react';
import { getCognitoAuth } from '../utils/auth';

interface State {
  signedin?: boolean;
}
export default class Signout extends React.Component<{}, State> {
  state = {
    signedin: undefined,
  };

  componentDidMount() {
    const auth = getCognitoAuth();
    this.setState({
      signedin: auth.isUserSignedIn(),
    });
    if (!auth.isUserSignedIn()) {
      // Redirect to login
      auth.getSession();
      return;
    }
  }

  render() {
    return (
      <h1>
        SIGNEDIN:{' '}
        {this.state.signedin === true
          ? 'yes'
          : this.state.signedin === undefined
            ? 'dunno'
            : 'no'}
      </h1>
    );
  }
}
