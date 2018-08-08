import gql from 'graphql-tag';

export const ADD_PATCHES = gql`
  mutation addPatches($graphId: ID!, $patches: [PatchInput!]!) {
    addPatches(graph: $graphId, patches: $patches) {
      graphId
      seq
      group
      path
      operation
      value
      oldvalue
      createdAt
      id
    }
  }
`;
