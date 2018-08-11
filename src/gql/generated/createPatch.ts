

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createPatch
// ====================================================

export interface createPatch_createPatch {
  graphId: string;
  seq: number;
  createdAt: string;
  id: string;
  payload: string;
}

export interface createPatch {
  createPatch: createPatch_createPatch;
}

export interface createPatchVariables {
  graphId: string;
  patch: PatchInput;
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