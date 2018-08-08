

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: addPatches
// ====================================================

export interface addPatches_addPatches {
  graphId: string;
  seq: number;
  group: number;
  path: string;
  operation: string;
  value: string;
  oldvalue: string | null;
  createdAt: string;
  id: string;
}

export interface addPatches {
  addPatches: addPatches_addPatches[] | null;
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
  group: number;
  path: string;
  operation: string;
  value: string;
  oldvalue?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================