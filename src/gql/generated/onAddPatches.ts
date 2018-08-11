

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: onAddPatches
// ====================================================

export interface onAddPatches_onAddPatches {
  graphId: string;
  seq: number;
  createdAt: string;
  id: string;
  payload: string;
}

export interface onAddPatches {
  onAddPatches: onAddPatches_onAddPatches[];
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