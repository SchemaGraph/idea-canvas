import * as React from 'react';
import { getCognitoAuth } from '../utils/auth';

export default class Signout extends React.Component {
  componentDidMount() {
    const auth = getCognitoAuth();
    auth.userhandler = {
      // user signed in
      onSuccess: result => {
        console.log('cognitoauth signout succes', result);


      },
      onFailure: err => {
        console.log('cognitoauth signout failure', err);
      },
    };
    if (auth.isUserSignedIn()) {
      auth.signOut();
    }
  }

  render() {
    return null;
  }
}
