

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: onCreatePatch
// ====================================================

export interface onCreatePatch_onCreatePatch {
  __typename: "Patch";
  graphId: string;
  seq: number;
  client: string;
  payload: string;
}

export interface onCreatePatch {
  onCreatePatch: onCreatePatch_onCreatePatch | null;
}

export interface onCreatePatchVariables {
  graphId: string;
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