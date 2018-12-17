/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getGraph
// ====================================================

export interface getGraph_getGraph_patches {
  seq: number;
  client: string;
  payload: string;
}

export interface getGraph_getGraph {
  id: string;
  patches: getGraph_getGraph_patches[] | null;
}

export interface getGraph {
  getGraph: getGraph_getGraph | null;
}

export interface getGraphVariables {
  id: string;
}
