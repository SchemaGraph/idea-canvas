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
import { getPatches, getPatchesVariables } from '../gql/generated/getPatches';
import { onCreateGraph } from '../gql/generated/onCreateGraph';
import {
  onCreatePatch,
  onCreatePatchVariables,
} from '../gql/generated/onCreatePatch';
import { CREATE_GRAPH } from '../gql/MutationCreateGraph';
import { CREATE_PATCH } from '../gql/MutationCreatePatch';
import { GET_GRAPH } from '../gql/QueryGetGraph';
import { GET_PATCHES } from '../gql/QueryGetPatches';
import { SUBSCRIBE_CREATE_GRAPH } from '../gql/SubscriptionCreateGraph';
import { SUBSCRIBTION_CREATE_PATCH } from '../gql/SubscriptionCreatePatch';
import { Entry } from '../patch-manager';
import { uuid } from '../utils';
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
  public readonly id: string;

  constructor() {
    const cache = new InMemoryCache();
    super({
      link,
      cache: (cache as any) as ApolloCache<T>,
    });
    this.id = uuid();
  }

  public uploadPatches(graphId: string, entry: Entry, version: number) {
    return this.mutate<createPatch, createPatchVariables>({
      mutation: CREATE_PATCH,
      fetchPolicy: 'no-cache',
      variables: {
        graphId,
        patch: toPatchInput(entry, version, this.id),
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

  public getPatches(graphId: string, since: number) {
    return this.query<getPatches, getPatchesVariables>({
      query: GET_PATCHES,
      fetchPolicy: 'no-cache',
      variables: {
        graphId,
        since,
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

export function revert({
  op,
  path,
  value,
  oldvalue,
}: CombinedPatch): CombinedPatch {
  return {
    op: op === 'replace' ? 'replace' : op === 'add' ? 'remove' : 'add',
    path,
    value: oldvalue,
    oldvalue: value,
  };
}

export function toCombinedPatches(
  patches: ReadonlyArray<IJsonPatch>,
  inversePatches: ReadonlyArray<IJsonPatch>
): CombinedPatch[] {
  if (patches.length !== inversePatches.length) {
    throw new Error('Invalid patch array lengths');
  }
  return patches.map((p, i) => ({
    ...p,
    oldvalue: inversePatches[i].value,
  }));
}

interface CombinedPatch extends IJsonPatch {
  oldvalue?: any;
}

function toPatchInput(
  { patches, inversePatches, action }: Entry,
  version: number,
  client: string,
): PatchInput {
  return {
    seq: version + 1,
    payload: JSON.stringify(toCombinedPatches(patches, inversePatches)),
    action: action.name,
    client,
  };
}

export function deserializeRemotePatch(p: getGraph_getGraph_patches, clientCheck?: string) {
  const patch = {
    ...p,
    payload: JSON.parse(p.payload) as CombinedPatch[],
  };
  if (clientCheck && patch.client === clientCheck) {
    throw new Error('Deserializing self-submitted patches');
  }
  return patch;
}

export function deserializeRemotePatches(
  remotePatches: getGraph_getGraph_patches[],
  clientCheck?: string
) {
  let seq = 0;
  const patches = remotePatches.map(p => {
    seq = p.seq;
    return deserializeRemotePatch(p, clientCheck);
  });
  return {
    version: seq,
    patches,
  };
}

export function flattenPatches(
  patches: CombinedPatch[][]
): ReadonlyArray<IJsonPatch> {
  const copy = patches.slice();
  const first = copy.shift();
  return first!.concat(...copy);
}
