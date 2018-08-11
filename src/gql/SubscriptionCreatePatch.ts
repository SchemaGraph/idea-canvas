import gql from 'graphql-tag';

export const SUBSCRIBTION_CREATE_PATCH = gql`
  subscription onCreatePatch($graphId: ID!) {
    onCreatePatch(graphId: $graphId) {
      __typename
      graphId
      seq
      createdAt
      id
      payload
    }
  }
`;
