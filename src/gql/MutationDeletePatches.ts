import gql from 'graphql-tag';

export const DELETE_PATCHES = gql`
  mutation deletePatches($graphId: ID!, $seqs: [Int!]!) {
    deletePatches(graphId: $graphId, seqs: $seqs) {
      graphId
      seq
    }
  }
`;
