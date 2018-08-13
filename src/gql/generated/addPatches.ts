

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: addPatches
// ====================================================

export interface addPatches_addPatches {
  graphId: string;
  seq: number;
  payload: string;
}

export interface addPatches {
  addPatches: addPatches_addPatches[];
}

export interface addPatchesVariables {
  graphId: string;
  patches: PatchInput[];
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