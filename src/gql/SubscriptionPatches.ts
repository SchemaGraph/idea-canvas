import gql from 'graphql-tag';

export const SUBSCRIBE_PATCHES = gql`
  subscription onAddPatches {
    onAddPatches {
      id
      operation
      path
      value
    }
  }
`;
