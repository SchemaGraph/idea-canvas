import { ApolloReducerConfig, InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
// tslint:disable-next-line:no-implicit-dependencies
import { getMainDefinition } from 'apollo-utilities';
import AWSAppSyncClient, {
  createAppSyncLink,
  createAuthLink,
  createLinkWithCache,
} from 'aws-appsync';
import { NonTerminatingHttpLink } from 'aws-appsync/lib/link';
import { OperationDefinitionNode } from 'graphql';
import { IJsonPatch } from 'mobx-state-tree';
import {
  addPatches,
  addPatchesVariables,
  PatchInput,
} from '../gql/generated/addPatches';
import {
  getGraph,
  getGraph_getGraph_patches,
  getGraphVariables,
} from '../gql/generated/getGraph';
import { onAddPatches } from '../gql/generated/onAddPatches';
import { onCreateGraph } from '../gql/generated/onCreateGraph';
import { ADD_PATCHES } from '../gql/MutationAddPatches';
import { GET_GRAPH } from '../gql/QueryGetGraph';
import { SUBSCRIBE_CREATE_GRAPH } from '../gql/SubscriptionCreateGraph';
import { SUBSCRIBE_PATCHES } from '../gql/SubscriptionPatches';
import asConfig from './AppSync';
import { SubscriptionHandshakeLink } from './subscription-handshake-link';

// const stateLink = createLinkWithCache(cache => withClientState({
//   cache,
//   resolvers: {
//     Mutation: {
//       // updateNetworkStatus: (_, { isConnected }, { cache }) => {
//       //   const data = {
//       //     networkStatus: {
//       //       __typename: 'NetworkStatus',
//       //       isConnected
//       //     },
//       //   };
//       //   cache.writeData({ data });
//       //   return null
//       // },
//     },
//   },
//   defaults: {
//     networkStatus: {
//       __typename: 'NetworkStatus',
//       isConnected: false
//     }
//   }
// }));

const createSubscriptionHandshakeLink = (
  urll: string,
  resultsFetcherLink = new HttpLink({ uri: urll })
) => {
  return ApolloLink.split(
    operation => {
      const { query } = operation;
      const { kind, operation: graphqlOperation } = getMainDefinition(
        query
      ) as OperationDefinitionNode;
      const isSubscription =
        kind === 'OperationDefinition' && graphqlOperation === 'subscription';

      return isSubscription;
    },
    ApolloLink.from([
      new NonTerminatingHttpLink('subsInfo', { uri: urll }),
      new SubscriptionHandshakeLink('subsInfo'),
    ]),
    resultsFetcherLink
  );
};

// const appSyncLink = createAppSyncLink(asConfig as any);
const { url, auth, region } = asConfig;
const link = ApolloLink.from([
  createAuthLink({ url, region, auth }),
  createSubscriptionHandshakeLink(url, new HttpLink({ uri: url })),
]);

// const appSyncClient = new AWSAppSyncClient({...asConfig, disableOffline: true});
// export const client = (appSyncClient as any) as ApolloClient<any>;
const client = new ApolloClient<any>({
  link,
  cache: new InMemoryCache(),
});

const TEST_GRAPH_ID = 'baf-graph';

export function savePatches(
  patches: ReadonlyArray<IJsonPatch>,
  inversePatches: ReadonlyArray<IJsonPatch>,
  actionCounter: number,
  patchCounter: number
) {
  return client.mutate<addPatches, addPatchesVariables>({
    mutation: ADD_PATCHES,
    fetchPolicy: 'no-cache',
    variables: {
      graphId: TEST_GRAPH_ID,
      patches: toPatchInputs(
        patches,
        inversePatches,
        actionCounter,
        patchCounter
      ),
    },
  });
}

export function getPatches() {
  return client.query<getGraph, getGraphVariables>({
    query: GET_GRAPH,
    fetchPolicy: 'no-cache',
    variables: {
      id: TEST_GRAPH_ID,
    },
  });
}

export function subscribeToPatches() {
  return client.subscribe<{data: onAddPatches}>({
    query: SUBSCRIBE_PATCHES,
  });
}

export function subscribeToGraphs() {
  return client.subscribe<{data: onCreateGraph}>({
    query: SUBSCRIBE_CREATE_GRAPH,
  });
}

function toPatchInputs(
  patches: ReadonlyArray<IJsonPatch>,
  inversePatches: ReadonlyArray<IJsonPatch>,
  actionCounter: number,
  patchCounter: number
): PatchInput[] {
  return patches.map((p, i) => {
    const inverse = inversePatches[i];
    const oldvalue =
      inverse && inverse.value !== undefined && inverse.value !== ''
        ? inverse.value
        : null;
    return {
      group: actionCounter + 1,
      seq: patchCounter + 1 + i,
      operation: p.op,
      path: p.path,
      value: JSON.stringify(p.value === '' ? null : p.value),
      oldvalue,
    };
  });
}

export function toJsonPatches(
  patches: Array<{operation: string, value: any, path: string} | null>
): ReadonlyArray<IJsonPatch> {
  return patches.filter(p => p !== null).map((p, _i) => {
    const { operation, value, path } = p!;
    return {
      op: operation,
      value: JSON.parse(value),
      path,
    };
    // const inverse = inversePatches[i];
    // const oldvalue =
    //   inverse && inverse.value !== undefined ? inverse.value : null;
    // return {
    //   group: actionCounter + 1,
    //   seq: patchCounter + 1 + i,
    //   op: p.op as Operation,
    //   path: p.path,
    //   value: JSON.stringify(p.value),
    //   oldvalue,
    // };
  }) as ReadonlyArray<IJsonPatch>;
}
