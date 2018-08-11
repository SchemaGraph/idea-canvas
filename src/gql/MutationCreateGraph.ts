import gql from 'graphql-tag';

export const CREATE_GRAPH = gql`
  mutation createGraph($id: ID!, $name: String) {
    createGraph(id: $id, name: $name) {
      id
      patches {
        graphId
        seq
        createdAt
        id
        payload
      }
    }
  }
`;
