import gql from 'graphql-tag';

export const CREATE_PATCH = gql`
  mutation createPatch($graphId: ID!, $patch: PatchInput!) {
    createPatch(graphId: $graphId, patch: $patch) {
      graphId
      seq
      createdAt
      id
      payload
    }
  }
`;
