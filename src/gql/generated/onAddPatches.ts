

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: onAddPatches
// ====================================================

export interface onAddPatches_onAddPatches {
  id: string;
  operation: string;
  path: string;
  value: string;
}

export interface onAddPatches {
  onAddPatches: onAddPatches_onAddPatches[] | null;
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