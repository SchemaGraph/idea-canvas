import gql from 'graphql-tag';

export const GET_GRAPH = gql`
  query getGraph($id: ID!) {
    getGraph(id: $id) {
      id
      patches {
        createdAt
        # graphId
        group
        # id
        # oldvalue
        operation
        path
        seq
        value
      }
    }
  }
`;
