// import { PatchManager } from "./patch-manager";
// import { Store } from "./store";
import { getApolloClient, MyApolloClient } from './appsync/client';
import { AUTH_TYPE } from 'aws-appsync';
import { AppSyncConf } from './appsync/config';
import { Credentials } from 'aws-sdk';
import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
} from 'amazon-cognito-identity-js';
import 'unfetch/polyfill';
import { Store } from './store';
import { PatchManager } from './patch-manager';
import { take, tap } from 'rxjs/operators';
import { timer } from 'rxjs';

function getAwsOptions() {
  let credentials = {};
  try {
    credentials = require('../.aws-credentials');
  } catch {}
  const {
    AWS_USER_POOL_ID,
    AWS_USER_POOL_CLIENT_ID,
    AWS_USER_POOL_USERNAME,
    AWS_USER_POOL_PASSWORD,
  } = process.env;
  const options = {
    Username: AWS_USER_POOL_USERNAME!,
    Password: AWS_USER_POOL_PASSWORD!,
    UserPoolId: AWS_USER_POOL_ID!,
    ClientId: AWS_USER_POOL_CLIENT_ID!,
    ...credentials,
  };
  for (const k in options) {
    if (!options[k as keyof typeof options]) {
      throw new Error(`${k} is not defined`);
    }
  }
  return options;
}

function getJWT() {
  // https://github.com/aws-amplify/amplify-js/tree/master/packages/amazon-cognito-identity-js
  const { Username, Password, UserPoolId, ClientId } = getAwsOptions();
  const authenticationDetails = new AuthenticationDetails({
    Username,
    Password,
  });
  const Pool = new CognitoUserPool({ UserPoolId, ClientId });
  const cognitoUser = new CognitoUser({ Username, Pool });
  return new Promise<string>((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function(result) {
        resolve(result.getAccessToken().getJwtToken());

        /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/
        // var idToken = result.idToken.jwtToken;
      },

      onFailure: function(err) {
        reject(err);
      },
    });
  });
}

async function setUp(client: MyApolloClient<any>) {
  try {
    const graph = await client.getGraph(TESTING_GRAPH_ID);
    const patches = graph.data.getGraph!.patches!;
    const deleted = await client.deletePatches(
      TESTING_GRAPH_ID,
      patches.map(p => p.seq)
    );
    console.log('DELETED EXISTING PATCHES', deleted.data!);
  } catch (e) {}
  try {
    await client.createGraph(TESTING_GRAPH_ID);
    console.log('CREATED ', TESTING_GRAPH_ID);
  } catch (error) {}
}

let token: string;
const TESTING_GRAPH_ID = 'integration-test-graph';
describe('PatchManager', () => {
  it('can get an access token', async () => {
    token = await getJWT();
    // console.log(token);
  });

  it('can be instantiated', async () => {
    const store = Store.create();
    const { url, region, auth: authOptions } = AppSyncConf({
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => token,
    });
    const client = getApolloClient(url, region, authOptions);
    await setUp(client);
    // try {
    //   const graph = await client.getGraph('animals');
    //   console.log(graph.errors, graph.data);
    // } catch (e) {
    //   console.log(e);
    // }
    const m = new PatchManager(store, client, TESTING_GRAPH_ID, 0, true);
    // m.
    m.$patchStream.pipe(tap(ev => console.log('ACTION:', ev.action.name))).subscribe();
    m.$uploadStream.pipe(tap(ev => console.log('UPLOADED:', ev.entry.action.name))).subscribe();
    store.addBox(100, 100, 'testbox');
    // const event = await m.$uploadStream.pipe(take(1)).toPromise();
    // console.log(event);
    await timer(1500).pipe(
      tap(console.log),
      take(1)
    ).toPromise();
  }, 5000);
});
