import {
  addMiddleware,
  applyPatch,
  createActionTrackingMiddleware,
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  recordPatches,
  IAnyStateTreeNode,
  getSnapshot,
} from 'mobx-state-tree';
import { IDisposer } from 'mobx-state-tree/dist/utils';
import { observable, action, flow } from 'mobx';

import { logPatch } from '../utils';
import { IGraph, IGraphSnapshot, emptyGraph } from './graph-store';

export interface Context {
  recorder: IPatchRecorder;
  actionId: string;
}
interface StatePatches {
  patches: ReadonlyArray<IJsonPatch>;
  inversePatches: ReadonlyArray<IJsonPatch>;
}

export type Entry = StatePatches & {
  action: string;
  tree: IAnyStateTreeNode;
};

interface UndoState {
  undo: () => void;
  redo: () => void;
}

function createUndoState(
  tree: IAnyStateTreeNode,
  actionName: string,
  patches: StatePatches
) {
  return {
    undo() {
      console.log('UNDOING', actionName);
      applyPatch(tree, patches.inversePatches.slice().reverse());
    },
    redo() {
      console.log('REDOING', actionName);
      applyPatch(tree, patches.patches.slice());
    },
  };
}
export interface IUndoManager {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export class UndoManager implements IUndoManager {
  @observable
  public now = 0;
  @observable
  public snapshot: IGraphSnapshot = emptyGraph();

  private currentRecorder?: IPatchRecorder;
  private patchingInProgress = false;
  private grouping = false;
  private groupEntries: Entry[] = [];
  private skipping = false;

  public readonly middlewareSubscription: IDisposer;
  private readonly history: UndoState[] = [];

  constructor(private readonly store: IGraph, private readonly dev = true) {
    this.middlewareSubscription = addMiddleware(
      store,
      createActionTrackingMiddleware<Context>({
        filter: this.filter,
        onStart: this.onStart,
        onResume: this.onResume,
        onSuspend: this.onSuspend,
        onSuccess: this.onSuccess,
        onFail: this.onFail,
      }),
      false
    );
    this.setNow(0);
  }

  private log(msg: string, ...args: any[]) {
    if (this.dev) {
      console.log(msg, ...args);
    }
  }
  private logPatches(patches: ReadonlyArray<IJsonPatch>) {
    if (this.dev) {
      patches.map(logPatch);
    }
  }

  private logError(error: any) {
    if (this.dev) {
      console.error(error);
    }
  }

  @action.bound
  private setNow(newNow: number) {
    this.log('NOW', newNow);
    this.now = newNow;
    this.snapshot = getSnapshot(this.store);
  }

  private addUndoState = ({ tree, action, patches, inversePatches }: Entry) => {
    this.log('ADDUNDOSTATE', action);
    const h = this.history;
    h.splice(this.now); // deletes forks
    h.push(createUndoState(tree, action, { patches, inversePatches }));
    this.setNow(h.length);
  };

  public undo = () => {
    const { undo } = this.history[this.now - 1];
    this.patchingInProgress = true;
    // const patches = inversePatches.slice().reverse();
    // this.log('UNDOING', action.name);
    try {
      // patches.forEach(p => applyPatch(this.store, p));
      undo();
      this.setNow(--this.now);
    } catch (error) {
      this.log('FAILED TO UNDO', error);
    } finally {
      this.patchingInProgress = false;
    }
  };

  public redo = () => {
    const { redo } = this.history[this.now];
    this.patchingInProgress = true;
    // this.log('REDOING', action.name);
    try {
      redo();
      this.setNow(++this.now);
    } catch (error) {
      this.log('FAILED TO REDO', error);
    } finally {
      this.patchingInProgress = false;
    }
  };

  public startGroup = () => {
    this.grouping = true;
  };
  public stopGroup = () => {
    this.grouping = false;
    if (this.groupEntries.length > 0) {
      this.addUndoState(simplifyEntries(this.groupEntries));
      this.groupEntries = [];
    }
  };

  public withoutUndo = <T>(fn: () => T) => {
    try {
      this.skipping = true;
      // flagSkipping = true;
      return fn();
    } finally {
      // flagSkipping = false;
      this.skipping = false;
    }
  };
  public withoutUndoFlow = (generatorFn: () => any) => {
    const self = this;
    return flow(function*() {
      self.skipping = true;
      // flagSkipping = true;
      const result = yield* generatorFn();
      // flagSkipping = false;
      self.skipping = false;
      return result;
    });
  };

  public get canUndo() {
    return this.now > 0;
  }

  public get canRedo() {
    return this.now < this.history.length;
  }

  private filter = ({ context }: IMiddlewareEvent) => {
    // this.log(name.toUpperCase());
    const verdict =
      !this.currentRecorder &&
      !this.patchingInProgress &&
      !this.skipping &&
      context !== this; // don't undo / redo undo redo :)
    return verdict;
  };

  private onStart = (call: IMiddlewareEvent) => {
    const { id, name } = call;
    this.currentRecorder = recordPatches(call.tree);
    return {
      recorder: this.currentRecorder,
      actionId: name + this.now,
    };
  };

  private onResume = (_call: IMiddlewareEvent, _c: Context) => {
    // this.log('ONRESUME');
  };
  private onSuspend = (_call: IMiddlewareEvent, _c: Context) => {
    // this.log('ONSUSPEND');
  };

  private onSuccess = (
    { tree, name }: IMiddlewareEvent,
    { recorder }: Context
  ) => {
    if (recorder && recorder.patches.length > 0 && !this.patchingInProgress) {
      if (this.grouping) {
        this.groupEntries.push({
          tree,
          action: name,
          ...recorder,
        });
      } else {
        this.addUndoState({ tree, action: name, ...recorder });
      }
    }
    this.currentRecorder = undefined;
  };
  private onFail = (
    _call: IMiddlewareEvent,
    { recorder, actionId }: Context
  ) => {
    if (recorder) {
      this.log('ONFAIL', actionId);
      recorder.undo();
      this.currentRecorder = undefined;
    }
  };
}

function simplifyEntries(entries: Entry[]): Entry {
  const combined = entries.reduce((s, c) => {
    const N = c.patches.length;
    s.patches = s.patches.concat(c.patches);
    s.inversePatches = s.inversePatches.concat(c.inversePatches);
    s.trees = s.trees.concat(new Array(N).fill(c.tree));
    s.actions = s.actions.concat(new Array(N).fill(c.action));
    return s;
  }, emptyState());
  const cache: {
    [k: string]: { prev: any; last: any; indices: number[] };
  } = {};
  // combine 'replace':s for the same path
  for (let i = 0; i < combined.patches.length; i++) {
    const { path, op, value } = combined.patches[i];
    if (op === 'replace') {
      const c = cache[path];
      if (c) {
        c.last = value;
        c.indices.push(i);
      } else {
        cache[path] = {
          prev: combined.inversePatches[i].value,
          last: value,
          indices: [i],
        };
      }
    }
  }
  let remove: number[] = [];
  for (const path in cache) {
    const { prev, last, indices } = cache[path];
    if (indices.length > 1) {
      const k = indices.shift()!;
      combined.patches[k] = {
        path,
        op: 'replace',
        value: last,
      };
      combined.inversePatches[k] = {
        path,
        op: 'replace',
        value: prev,
      };
      remove = remove.concat(indices);
    }
  }
  const removeSet = new Set(remove);
  return {
    patches: combined.patches.filter((_v, i) => !removeSet.has(i)),
    inversePatches: combined.inversePatches.filter(
      (_v, i) => !removeSet.has(i)
    ),
    tree: combined.trees[0], // trust that they are all from the same store
    action: combined.actions[0],
  };
}

function emptyState(): {
  patches: IJsonPatch[];
  inversePatches: IJsonPatch[];
  actions: string[];
  trees: IAnyStateTreeNode[];
} {
  return {
    patches: [],
    inversePatches: [],
    actions: [],
    trees: [],
  };
}
