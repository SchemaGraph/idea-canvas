/* tslint:disable */
// This file was automatically generated and should not be edited.

import { PatchInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: createPatch
// ====================================================

export interface createPatch_createPatch {
  graphId: string;
  seq: number;
  client: string;
  payload: string;
}

export interface createPatch {
  createPatch: createPatch_createPatch;
}

export interface createPatchVariables {
  graphId: string;
  patch: PatchInput;
}
