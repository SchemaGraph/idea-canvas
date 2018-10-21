import { values } from 'mobx';
import {
  applyPatch,
  applySnapshot,
  onSnapshot,
  types,
} from 'mobx-state-tree';
import { Subject } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import {
  deserializeRemotePatches,
  flattenPatches,
  MyApolloClient,
} from './appsync/client';
import {
  Arrow,
  arrows,
  Box,
  boxes,
  ConnectingArrow,
  Context,
  contexts,
  IArrow,
  IBox,
} from './components/models';
import {
  TOOL_ADD_NODE,
  TOOL_CONNECT,
  TOOL_NONE,
  TOOL_PAN,
  TOOL_REMOVE_NODE,
  TOOL_LAYERS,
} from './components/toolbar/constants';
import { PatchManager } from './patch-manager';
import { defaultContextColor } from './theme/theme';
import { uuid } from './utils';
import { getCloseEnoughBox } from './utils/vec';

const SelectionType = types.maybeNull(types.string);

export type CreateBoxAction = (
  name: string,
  x: number,
  y: number,
  source?: any
) => void;

export interface Zoom {
  scale: number;
  offsetX: number;
  offsetY: number;
}

let connectableBoxes: IBox[] = [];
const contextCounts: {[k: string]: number} = {};
export const Store = types
  .model('Store', {
    boxes,
    arrows,
    contexts,
    dragging: SelectionType,
    selection: SelectionType,
    editing: SelectionType,
    deepEditing: SelectionType,
    connecting: types.maybeNull(ConnectingArrow),
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    tool: TOOL_NONE,
    newContextInput: false,
    newContextInputValue: '',
    canvasWidth: -1,
    canvasHeight: -1,
    showSidebar: true,
  })
  .views(self => ({
    get zoom(): Zoom {
      const { scale, offsetX, offsetY } = self;
      // console.log('getZoom', scale, offsetX, offsetY);
      return {
        scale,
        offsetX,
        offsetY,
      };
    },
    get isMobile(): boolean {
      const { canvasWidth, canvasHeight } = self;
      if (canvasWidth === -1 || canvasHeight === -1) {
        return true;
      }
      console.log(canvasWidth, canvasHeight);
      return canvasWidth >= 320 && canvasWidth <= 480;
    },
  }))
  .actions(self => ({
    addBox(x: number, y: number, name?: string) {
      const box = Box.create({ name, x, y, id: uuid() });
      self.boxes.put(box);
      return box;
    },
    removeBox(box: IBox) {
      const removeArrows = self.arrows.filter(
        a => a.to.id === box.id || a.from.id === box.id
      );
      if (removeArrows) {
        removeArrows.map(a => self.arrows.remove(a));
      }
      self.boxes.delete(box.id);
    },
    removeArrow(arrow: IArrow) {
      self.arrows.remove(arrow);
    },
    setDragging(dragging: any) {
      self.dragging = dragging;
    },
    setZoom(z: Zoom) {
      const { scale, offsetX, offsetY } = z;
      // console.log('setZoom', scale, offsetX, offsetY);
      self.scale = scale;
      self.offsetX = offsetX;
      self.offsetY = offsetY;
    },
    setCanvasDimensions(w: number, h: number) {
      self.canvasWidth = w;
      self.canvasHeight = h;
    },
    clearSelection() {
      self.selection = null;
    },
    setEditing(target: string | null) {
      self.editing = target;
    },
    setDeepEditing(target: string | null) {
      self.deepEditing = target;
    },
    toggleContextInput() {
      self.newContextInput = !self.newContextInput;
    },
    addContext(name: string, customColor?: string, assignTo?: IBox) {
      const existing = self.contexts.get(name);
      self.newContextInputValue = '';
      if (existing || !name || name.length === 0) {
        return undefined;
      }
      const seq = self.contexts.size;
      const color = customColor || defaultContextColor(seq).toString();
      const context = Context.create({ name, color, seq });
      self.contexts.put(context);
      if (assignTo) {
        assignTo.context = context;
      }
      return context;
    },
    removeContext(name: string) {
      const context = self.contexts.get(name);
      if (!context) {
        return;
      }
      for (const box of self.boxes.values()) {
        if (box.context === context) {
          box.setContext();
        }
      }
      self.contexts.delete(context.name);
    },
    setContextInputValue(name: string) {
      self.newContextInputValue = name;
    },
    setSidebarVisibility(v: boolean) {
      self.showSidebar = v;
    },
  }))
  .actions(self => ({
    setTool(tool: string) {
      // console.log(tool.toUpperCase());
      self.tool = tool;
      if (tool === TOOL_ADD_NODE) {
        self.clearSelection();
      }
    },
    removeElement(id: string) {
      const box = self.boxes.get(id);
      if (box) {
        self.removeBox(box);
      }
      const arrow = self.arrows.find(a => a.id === id);
      if (arrow) {
        self.removeArrow(arrow);
      }
    },
    addArrow(from: string, to: string) {
      const existing = self.arrows.find(
        a => a.from.id === from && a.to.id === to
      );
      if (existing) {
        return;
      }
      const fromBox = self.boxes.get(from);
      const toBox = self.boxes.get(to);
      if (!fromBox || !toBox) {
        return;
      }
      const arrow = Arrow.create({
        id: uuid(),
        from,
        to,
      });
      self.arrows.push(arrow);
    },
  }))
  .actions(self => ({
    createBox(name?: string, x?: number, y?: number) {
      const xx = x || (self.canvasWidth / 2 - 37 - self.offsetX) / self.scale;
      const yy = y || (50 - self.offsetY) / self.scale;
      const box = self.addBox(xx, yy, name);
      self.setEditing(box.id);
      // const source = self.selection;
      // if (source) {
      //   self.addArrow(source, box.id);
      // }
      // self.clearSelection();
      // box.setSelected(true);
    },
    select(target: string | null) {
      const tool = self.tool;
      const selection = self.selection;
      if (
        tool !== TOOL_ADD_NODE &&
        tool !== TOOL_PAN &&
        tool !== TOOL_REMOVE_NODE
      ) {
        if (tool === TOOL_CONNECT) {
          if (selection && target && target !== selection) {
            self.addArrow(selection, target);
          }
          if (!selection && target) {
            self.selection = target;
          }
        } else {
          self.selection = target;
        }
      }
      if (tool === TOOL_REMOVE_NODE && target) {
        self.removeElement(target);
      }
      // if (tool === TOOL_LAYERS && target) {
      //   const box = self.boxes.get(target);
      //   if (box) {
      //     const clicks = contextCounts[target] || 0;
      //     contextCounts[target] = clicks + 1;
      //     let counter = 0;
      //     let N = self.contexts.size;
      //     for (const context of self.contexts.values()) {
      //       console.log('select', box.id, clicks % N, counter);
      //       if (clicks % N === counter) {
      //         box.setContext(context);
      //         break;
      //       }
      //       counter++;
      //     }
      //   }
      // }
    },
    startConnecting(from: IBox, to: [number, number]) {
      self.connecting = ConnectingArrow.create({
        from,
        toX: to[0],
        toY: to[1],
      });
      connectableBoxes = [];
      self.boxes.forEach(v => {
        if (v !== from) {
          connectableBoxes.push(v);
        }
      });
    },
    updateConnecting(to: [number, number]) {
      if (!self.connecting) {
        return;
      }
      self.connecting.toX = to[0];
      self.connecting.toY = to[1];
      const targetCandidate = getCloseEnoughBox(to, connectableBoxes, 20);
      self.connecting.to = targetCandidate ? targetCandidate.box : null;
      // if (targetCandidate) {
      //   // self.arrowCandidate = Arrow.create({
      //   //   from: self.connecting.from,
      //   //   to: targetCandidate.box,
      //   //   id: uuid(),
      //   // });
      //   // self.connecting.intersectionX = targetCandidate.distance.intersection[0];
      //   // self.connecting.intersectionY = targetCandidate.distance.intersection[1];
      //   // self.connecting.distance = targetCandidate.distance.distance;
      // } else {
      //   self.connecting.to = null;
      //   // self.connecting.intersectionX = null;
      //   // self.connecting.intersectionY = null;
      //   // self.arrowCandidate = null;
      // }
    },
    endConnecting() {
      if (self.connecting && self.connecting.to) {
        self.addArrow(self.connecting.from.id, self.connecting.to.id);
      }
      self.connecting = null;
    },
  }));

export async function remoteLoad(
  store: IStore,
  graphId: string,
  client: MyApolloClient<any>,
  dev = true
) {
  let initialVersion = 0;
  const {
    data: { getGraph },
  } = await client.getGraph(graphId);
  if (!getGraph) {
    const r = await client.createGraph(graphId);
  }
  if (getGraph && getGraph.patches && getGraph.patches.length > 0) {
    const { patches, version } = deserializeRemotePatches(getGraph.patches);
    initialVersion = version;
    applyPatch(store, flattenPatches(patches.map(p => p.payload)));
  }
  return new PatchManager(store, client, graphId, initialVersion, dev);
}

export function initStore() {
  const store = Store.create();
  return store;
}

const snapshotSaver = (key: string) => (snapshot: IStoreSnapshot) => {
  localStorage.setItem(
    key,
    JSON.stringify({
      ...snapshot,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      tool: TOOL_NONE,
    })
  );
};

const snapshotStream = new Subject<IStoreSnapshot>();

export function localLoad(store: IStore, localStorageKey = 'ideacanvas-graph') {
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(localStorageKey);
    const saver = snapshotSaver(localStorageKey);
    if (cached) {
      try {
        const snapshot = JSON.parse(cached);
        applySnapshot(store, snapshot);
      } catch (error) {
        console.error(error);
      }
    }
    onSnapshot(store, snapshot => {
      if (localStorage) {
        snapshotStream.next(snapshot);
      }
    });
    snapshotStream
      .pipe(
        debounceTime(400)
        // tap(_ => console.log('SAVING TO LOCALSTORAGE'))
      )
      .subscribe(
        saver,
        e => {
          console.error(e);
        },
        () => console.log('snaphsotStream completed')
      );
  }

  return store;
}

export function localClear() {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}

export type IStore = typeof Store.Type;
export type IStoreSnapshot = typeof Store.SnapshotType;
export interface IStores {
  store: IStore;
}
