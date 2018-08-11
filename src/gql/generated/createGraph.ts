

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createGraph
// ====================================================

export interface createGraph_createGraph_patches {
  graphId: string;
  seq: number;
  createdAt: string;
  id: string;
  payload: string;
}

export interface createGraph_createGraph {
  id: string;
  patches: createGraph_createGraph_patches[] | null;
}

export interface createGraph {
  createGraph: createGraph_createGraph;
}

export interface createGraphVariables {
  id: string;
  name?: string | null;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * 
 */
export interface PatchInput {
  seq: number;
  payload: string;
  client: string;
  action?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================