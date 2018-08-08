

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getGraph
// ====================================================

export interface getGraph_getGraph_patches {
  createdAt: string;
  group: number;
  operation: string;
  path: string;
  seq: number;
  value: string;
}

export interface getGraph_getGraph {
  id: string;
  patches: (getGraph_getGraph_patches | null)[] | null;
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
  group: number;
  path: string;
  operation: string;
  value: string;
  oldvalue?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================