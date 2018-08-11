// tslint:disable-next-line:no-implicit-dependencies
import { ApolloCache } from 'apollo-cache';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
// tslint:disable-next-line:no-implicit-dependencies
import { getMainDefinition } from 'apollo-utilities';
import { createAuthLink } from 'aws-appsync';
import { NonTerminatingHttpLink } from 'aws-appsync/lib/link';
import { OperationDefinitionNode } from 'graphql';
import { IJsonPatch } from 'mobx-state-tree';
import {
  createGraph,
  createGraphVariables,
} from '../gql/generated/createGraph';
import {
  createPatch,
  createPatchVariables,
  PatchInput,
} from '../gql/generated/createPatch';
import {
  getGraph,
  getGraph_getGraph_patches,
  getGraphVariables,
} from '../gql/generated/getGraph';
import { onCreateGraph } from '../gql/generated/onCreateGraph';
import {
  onCreatePatch,
  onCreatePatchVariables,
} from '../gql/generated/onCreatePatch';
import { CREATE_GRAPH } from '../gql/MutationCreateGraph';
import { CREATE_PATCH } from '../gql/MutationCreatePatch';
import { GET_GRAPH } from '../gql/QueryGetGraph';
import { SUBSCRIBE_CREATE_GRAPH } from '../gql/SubscriptionCreateGraph';
import { SUBSCRIBTION_CREATE_PATCH } from '../gql/SubscriptionCreatePatch';
import { Entry } from '../patch-manager';
import asConfig from './AppSync';
import { SubscriptionHandshakeLink } from './subscription-handshake-link';

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
// export const apolloClient = new ApolloClient<any>();

export class MyApolloClient<T> extends ApolloClient<T> {
  constructor() {
    const cache = new InMemoryCache();
    super({
      link,
      cache: (cache as any) as ApolloCache<T>,
    });
  }

  public uploadPatches(graphId: string, entry: Entry, version: number) {
    return this.mutate<createPatch, createPatchVariables>({
      mutation: CREATE_PATCH,
      fetchPolicy: 'no-cache',
      variables: {
        graphId,
        patch: toPatchInput(entry, version),
      },
    });
  }

  public createGraph(id: string, name?: string) {
    return this.mutate<createGraph, createGraphVariables>({
      mutation: CREATE_GRAPH,
      fetchPolicy: 'no-cache',
      variables: {
        id,
        name,
      },
    });
  }

  public getGraph(id: string) {
    return this.query<getGraph, getGraphVariables>({
      query: GET_GRAPH,
      fetchPolicy: 'no-cache',
      variables: {
        id,
      },
    });
  }

  public subscribeToPatches(graphId: string) {
    return this.subscribe<{ data: onCreatePatch }, onCreatePatchVariables>({
      query: SUBSCRIBTION_CREATE_PATCH,
      variables: {
        graphId,
      },
    });
  }

  public subscribeToGraphs() {
    return this.subscribe<{ data: onCreateGraph }>({
      query: SUBSCRIBE_CREATE_GRAPH,
    });
  }
}

function toPatchInput(entry: Entry, version: number): PatchInput {
  return {
    seq: version + 1,
    payload: JSON.stringify({
      patches: entry.patches,
      inversePatches: entry.inversePatches,
      action: {
        name: entry.action.name,
        id: entry.action.id,
      },
    }),
  };
}

export function deserializeEntry({
  seq,
  payload,
  createdAt,
  id,
  graphId,
}: getGraph_getGraph_patches) {
  return {
    seq,
    createdAt,
    id,
    graphId,
    entry: JSON.parse(payload) as Entry,
  };
}

export function deserializeEntries(patches: getGraph_getGraph_patches[]) {
  let seq = 0;
  const entries = patches.map(p => {
    seq = p.seq;
    const d = JSON.parse(p.payload) as Entry;
    return d;
  });
  return {
    version: seq,
    entries,
  };
}

export function combineEntries(entries: Entry[]): ReadonlyArray<IJsonPatch> {
  // let patches: ReadonlyArray<IJsonPatch> = [];
  // for (const entry of entries) {
  //   patches = patches.concat()
  // }
  const copy = entries.map(entry => entry.patches);
  const first = copy.shift();
  return first!.concat(...copy);
  // return entries.fl
}
