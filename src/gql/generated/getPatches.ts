/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getPatches
// ====================================================

export interface getPatches_getPatches {
  seq: number;
  payload: string;
  client: string;
}

export interface getPatches {
  getPatches: getPatches_getPatches[] | null;
}

export interface getPatchesVariables {
  graphId: string;
  since: number;
}
