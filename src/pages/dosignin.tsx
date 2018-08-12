import * as React from 'react';
import { getCognitoAuth } from '../utils/auth';

export default class Signin extends React.Component {
  componentDidMount() {
    const auth = getCognitoAuth();
    auth.userhandler = {
      // user signed in
      onSuccess: result => {
        console.log('cognitoauth signin succes', result);
      },
      onFailure: err => {
        console.log('cognitoauth signin failure', err);
      },
    };
    if (!auth.isUserSignedIn()) {
      auth.getSession();
    }
  }

  render() {
    return null;
  }
}
