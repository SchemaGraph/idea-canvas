/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: deletePatches
// ====================================================

export interface deletePatches_deletePatches {
  graphId: string;
  seq: number;
}

export interface deletePatches {
  deletePatches: (deletePatches_deletePatches | null)[] | null;
}

export interface deletePatchesVariables {
  graphId: string;
  seqs: number[];
}
