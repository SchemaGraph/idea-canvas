import gql from 'graphql-tag';

export const SUBSCRIBE_CREATE_GRAPH = gql`
  subscription onCreateGraph {
    onCreateGraph {
      id
    }
  }
`;
