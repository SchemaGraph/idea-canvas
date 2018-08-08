

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: onCreateGraph
// ====================================================

export interface onCreateGraph_onCreateGraph {
  id: string;
}

export interface onCreateGraph {
  onCreateGraph: onCreateGraph_onCreateGraph | null;
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