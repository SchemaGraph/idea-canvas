import gql from 'graphql-tag';

export const SUBSCRIBE_PATCHES = gql`
  subscription onAddPatches {
    onAddPatches {
      graphId
      seq
      createdAt
      id
      payload
    }
  }
`;
