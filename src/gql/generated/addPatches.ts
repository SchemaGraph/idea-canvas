/* tslint:disable */
// This file was automatically generated and should not be edited.

import { PatchInput } from "./globalTypes";

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
