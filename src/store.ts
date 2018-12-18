import { applySnapshot, onSnapshot, types } from 'mobx-state-tree';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ConnectingArrow, IBox, Box } from './components/models';
import {
  TOOL_ADD_NODE,
  TOOL_CONNECT,
  TOOL_NONE,
  TOOL_PAN,
  TOOL_REMOVE_NODE,
} from './components/toolbar/constants';
import { getCloseEnoughBox } from './utils/vec';
import { Graph } from './graph-store';

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

export const Application = types
  .model('Application', {
    graph: Graph,
    dragging: SelectionType,
    selection: SelectionType,
    editing: SelectionType,
    deepEditing: SelectionType,
    connecting: types.maybeNull(ConnectingArrow),
    initialBox: types.maybeNull(Box),
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
      self.newContextInputValue = '';
      return self.graph.addContext(name, customColor, assignTo);
    },
    setContextInputValue(name: string) {
      self.newContextInputValue = name;
    },
    setSidebarVisibility(v: boolean) {
      self.showSidebar = v;
    },
    removeElement(id: string) {
      const box = self.graph.boxes.get(id);
      if (box) {
        self.graph.removeBox(box);
      }
      const arrow = self.graph.arrows.find(a => a.id === id);
      if (arrow) {
        self.graph.removeArrow(arrow);
      }
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
  }))
  .actions(self => ({
    createBox(x: number, y: number) {
      // const xx = x || (self.canvasWidth / 2 - 37 - self.offsetX) / self.scale;
      // const yy = y || (50 - self.offsetY) / self.scale;
      self.initialBox = Box.create({ x, y, id: 'initial-box' });
      self.setEditing(self.initialBox.id);
    },
    commitBox(name: string) {
      if (self.initialBox && typeof name === 'string' && name.length > 0) {
        const {x, y} = self.initialBox;
        self.graph.addBox(x, y, name);
      }
      self.initialBox = null;
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
            self.graph.addArrow(selection, target);
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
    },
    startConnecting(from: IBox, to: [number, number]) {
      self.connecting = ConnectingArrow.create({
        from: from.id,
        toX: to[0],
        toY: to[1],
      });
    },
    updateConnecting(to: [number, number]) {
      if (!self.connecting) {
        return;
      }
      self.connecting.toX = to[0];
      self.connecting.toY = to[1];
      const targetCandidate = getCloseEnoughBox(
        to,
        self.graph.boxes.values(),
        20
      );
      self.connecting.to = targetCandidate ? targetCandidate : null;
    },
    endConnecting() {
      if (self.connecting && self.connecting.to) {
        self.graph.addArrow(self.connecting.from.id, self.connecting.to.id);
      }
      self.connecting = null;
    },
  }));

export function initStore() {
  // const graph = Graph.create();
  const store = Application.create({ graph: {} });
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

export type IStore = typeof Application.Type;
export type IStoreSnapshot = typeof Application.SnapshotType;
export interface IStores {
  store: IStore;
}
