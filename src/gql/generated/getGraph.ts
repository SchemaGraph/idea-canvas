

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getGraph
// ====================================================

export interface getGraph_getGraph_patches {
  graphId: string;
  seq: number;
  createdAt: string;
  id: string;
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
}

//==============================================================
// END Enums and Input Objects
//==============================================================