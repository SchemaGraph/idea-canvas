import gql from 'graphql-tag';

export const GET_PATCHES = gql`
  query getPatches($graphId: ID!, $since: Int!) {
    getPatches(graphId: $graphId, since: $since) {
      seq
      payload
      client
    }
  }
`;
