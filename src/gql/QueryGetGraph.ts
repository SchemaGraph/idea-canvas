import gql from 'graphql-tag';

export const GET_GRAPH = gql`
  query getGraph($id: ID!) {
    getGraph(id: $id) {
      id
      patches {
        seq
        client
        payload
      }
    }
  }
`;
