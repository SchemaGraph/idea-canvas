import { FetchResult } from 'apollo-link';
import {
  addMiddleware,
  applyPatch,
  createActionTrackingMiddleware,
  flow,
  getEnv,
  getRoot,
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  IStateTreeNode,
  recordPatches,
  types,
} from 'mobx-state-tree';
import {
  savePatches,
  subscribeToPatches,
  toJsonPatches,
} from './appsync/client';
import { addPatches, addPatches_addPatches } from './gql/generated/addPatches';

const Entry = types.model('UndoManagerEntry', {
  patches: types.frozen<ReadonlyArray<IJsonPatch>>(),
  inversePatches: types.frozen<ReadonlyArray<IJsonPatch>>(),
});

interface Context {
  recorder?: IPatchRecorder;
  actionId?: string;
}

let applied: Set<string> = new Set();

export const PatchManager = types
  .model('UndoManager', {
    history: types.optional(types.array(Entry), []),
    undoIdx: 0,
    seq: 0,
  })
  .views(self => ({
    get canUndo() {
      return self.undoIdx > 0;
    },
    get canRedo() {
      return self.undoIdx < self.history.length;
    },
  }))
  .actions(self => {
    let skipping = false;
    let flagSkipping = false;
    let targetStore: IStateTreeNode;
    let replaying = false;
    let middlewareDisposer: () => void;
    let grouping = false;
    let groupRecorder: any = {
      patches: [] as ReadonlyArray<IJsonPatch>,
      inversePatches: [] as ReadonlyArray<IJsonPatch>,
    };
    let recordingActionId: any = null;
    let recordingActionLevel = 0;

    const startRecordAction = (call: IMiddlewareEvent) => {
      // level for the case that actions have the same name
      skipping = flagSkipping;
      recordingActionLevel++;
      const actionId = call.name + recordingActionLevel;
      recordingActionId = actionId;
      return {
        recorder: recordPatches(call.tree),
        actionId,
      };
    };
    const stopRecordingAction = (recorder: IPatchRecorder): void => {
      recordingActionId = null;
      if (!skipping) {
        if (grouping) {
          return cachePatchForGroup(recorder);
        }
        (self as any).addUndoState(recorder);
      }
      skipping = flagSkipping;
    };
    const cachePatchForGroup = (recorder: IPatchRecorder): void => {
      groupRecorder = {
        patches: groupRecorder.patches.concat(recorder.patches),
        inversePatches: groupRecorder.inversePatches.concat(
          recorder.inversePatches
        ),
      };
    };
    const undoRedoMiddleware = createActionTrackingMiddleware<Context>({
      // the flagSkipping === false check is mainly a performance optimisation
      filter: call => flagSkipping === false && call.context !== self, // don't undo / redo undo redo :)
      onStart: call => {
        if (!recordingActionId) {
          return startRecordAction(call);
        }
        return { recorder: undefined, actionId: undefined };
      },
      onResume: (_call, { recorder }) => recorder && (recorder as any).resume(),
      onSuspend: (_call, { recorder }) => recorder && recorder.stop(),
      onSuccess: (_call, { recorder, actionId }) => {
        if (recordingActionId === actionId && recorder) {
          stopRecordingAction(recorder);
        }
      },
      onFail: (_call, { recorder }) => recorder && recorder.undo(),
    });

    const subscribe = () => {
      // subscribeToPatches().subscribe(
      //   ({ data }) => {
      //     const remotePatches = data.onAddPatches;
      //     if (remotePatches) {
      //       // const patches = toJsonPatches(data.getGraph.patches);
      //       // console.log(data.getGraph.patches);
      //       const newOnes = remotePatches.filter(({id}) => !applied.has(id));
      //       applyPatch(self, toJsonPatches(newOnes));
      //     }
      //     console.log('SUBSCRIBE RESULT', remotePatches);
      //   },
      //   e => {
      //     console.log('SUBSCRIBE ERROR', e);
      //   }
      // );
    };

    return {
      addUndoState: flow(function* addUndoState({
        patches,
        inversePatches,
      }: IPatchRecorder) {
        if (replaying || (patches && patches.length === 0)) {
          // skip recording if this state was caused by undo / redo
          // or if patches is empty
          return;
        }
        self.history.splice(self.undoIdx);
        console.log('ADDUNOSTATE');
        try {
          const { data, errors }: FetchResult<addPatches> = yield savePatches(
            patches,
            inversePatches,
            self.history.length,
            self.seq
          );
          if (errors) {
            throw errors;
          }
          if (data && data.addPatches) {
            const p = data.addPatches as addPatches_addPatches[];
            const ids = p.map(({id}) => id);
            applied = new Set(ids.concat(Array.from(applied)));
            console.log('APPLIED', applied);
            // console.log('savePatches', data);

          }
          // console.log(result);
          self.history.push({
            patches,
            inversePatches,
          });
          self.undoIdx = self.history.length;
          self.seq += patches.length;
          // console.log(patches);
        } catch (e) {
          console.log(e);
        }
      }),
      afterCreate() {
        targetStore = getEnv(self).targetStore || getRoot(self);
        if (!targetStore || targetStore === self) {
          throw new Error(
            "UndoManager should be created as part of a tree, or with `targetStore` in it's environment"
          );
        }
        subscribe();
        middlewareDisposer = addMiddleware(
          targetStore,
          undoRedoMiddleware,
          false
        );
      },
      beforeDestroy() {
        middlewareDisposer();
      },
      undo() {
        replaying = true;
        self.undoIdx--;
        // n.b: reverse patches back to forth
        // TODO: add error handling when patching fails? E.g. make the operation atomic?
        applyPatch(
          getRoot(targetStore),
          self.history[self.undoIdx].inversePatches!.slice().reverse()
        );
        replaying = false;
      },
      redo() {
        replaying = true;
        // TODO: add error handling when patching fails? E.g. make the operation atomic?
        applyPatch(getRoot(targetStore), self.history[self.undoIdx]
          .patches as any); // TODO: fix compile error here?
        self.undoIdx++;
        replaying = false;
      },
      withoutUndo(fn: () => any) {
        try {
          skipping = true;
          flagSkipping = true;
          return fn();
        } finally {
          flagSkipping = false;
        }
      },
      withoutUndoFlow(generatorFn: () => any) {
        return flow(function*() {
          skipping = true;
          flagSkipping = true;
          const result = yield* generatorFn();
          flagSkipping = false;
          return result;
        });
      },
      startGroup(fn: () => any) {
        grouping = true;
        return fn();
      },
      stopGroup(fn?: () => any) {
        if (fn) {
          fn();
        }
        grouping = false;
        (self as any).addUndoState(groupRecorder);
        groupRecorder = { patches: [], inversePatches: [] };
      },
    };
  });
