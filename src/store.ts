import { types, getSnapshot, applySnapshot, flow } from 'mobx-state-tree';
import { ConnectingArrow, IBox, Box, Arrow } from './components/models';
import {
  TOOL_ADD_NODE,
  TOOL_CONNECT,
  TOOL_NONE,
  TOOL_PAN,
  TOOL_REMOVE_NODE,
} from './components/toolbar/constants';
import { getCloseEnoughBox } from './utils/vec';
import { Graph, IGraphSnapshot, emptyGraph } from './graph-store';
import { UndoManager } from './undo-manager';
import { autorun, IReactionDisposer, observable } from 'mobx';
import fetch from 'unfetch';
import { defaultContextColor } from './theme/theme';
import { getForceSimulation, GraphSimulation } from './force-layout';

const SelectionType = types.maybeNull(types.string);

export const INITIAL_BOX_ID = 'initial-box';
export const INITIAL_BOX_WIDTH = 120;
export const INITIAL_BOX_HEIGHT = 60;
const initialBox = {
  id: INITIAL_BOX_ID,
  width: INITIAL_BOX_WIDTH,
  height: INITIAL_BOX_HEIGHT,
};

export const LOCAL_STORAGE_KEY = 'idea-canvas-graph';

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
      console.log(canvasWidth, canvasHeight);
      if (canvasWidth === -1 || canvasHeight === -1) {
        return true;
      }
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
    setEditing(id: string | null) {
      self.editing = id;
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
      self.initialBox = Box.create({ x, y, ...initialBox });
      self.editing = self.initialBox.id;
    },
    commitBox(name: string) {
      if (self.initialBox && typeof name === 'string' && name.length > 0) {
        const { x, y } = self.initialBox;
        self.graph.addBox(x, y, name);
      }
      self.editing = null;
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
      self.connecting.to =
        targetCandidate && targetCandidate.id !== self.connecting.from.id
          ? targetCandidate
          : null;
    },
    endConnecting() {
      if (self.connecting && self.connecting.to) {
        self.graph.addArrow(self.connecting.from.id, self.connecting.to.id);
      }
      self.connecting = null;
    },
    lesMiserables: flow(function* lesMiserables() {
      const graph: IGraphSnapshot = yield loadLesMiserables();
      applySnapshot(self.graph, graph);
    }),
  }))
  .extend(self => {
    let undo: UndoManager | undefined;
    let autorunDisposer: IReactionDisposer | undefined;
    const simulation = observable.box<GraphSimulation>(); // GraphSimulation | undefined;
    async function afterCreate() {
      console.log('afterCreate');
      undo = new UndoManager(self.graph);
      const saver = snapshotSaver(LOCAL_STORAGE_KEY);
      applySnapshot(self.graph, await loadLesMiserables());
      simulation.set(getForceSimulation(self.graph, self.canvasWidth - 400, self.canvasHeight, undo));

      autorunDisposer = autorun(
        () => {
          if (undo) {
            // saver(undo.snapshot);
            // console.log('SAVED SNAPSHOT');
          }
        },
        { delay: 200 }
      );
    }

    function beforeDestroy() {
      console.log('beforeDestroyy');
      if (undo) {
        undo.middlewareSubscription();
      }
      if (autorunDisposer) {
        autorunDisposer();
      }
    }
    return {
      actions: {
        afterCreate,
        beforeDestroy,
      },
      views: {
        get undoManager() {
          return undo!;
        },
        get simulation() {
          return simulation.get();
        },
      },
    };
  });

export function initStore(useLocalStorage = true) {
  // const graph = Graph.create();
  let graph = {};
  if (useLocalStorage && typeof localStorage !== 'undefined') {
    const candidate = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (candidate) {
      graph = JSON.parse(candidate);
    }
  }
  let store: IStore;
  try {
    store = Application.create({ graph });
  } catch {
    // The stored snapshot is outdated, clear it
    localClear();
    store = Application.create({ graph: {} });
  }
  return store;
}

const snapshotSaver = (key: string) => (snapshot: IGraphSnapshot) => {
  localStorage.setItem(key, JSON.stringify(snapshot));
};

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

interface LesMiserables {
  nodes: Array<{ id: string; group: number }>;
  links: Array<{ source: string; target: string; value: number }>;
}
async function loadLesMiserables() {
  const response = await fetch(
    'https://gist.githubusercontent.com/mbostock/4062045/raw/5916d145c8c048a6e3086915a6be464467391c62/miserables.json'
  );
  const data: LesMiserables = await response.json();
  const groups = new Set<string>();
  const nodes = new Set<string>();
  const graph = emptyGraph();
  const W = 600;
  const H = 600;
  for (const { id, group } of data.nodes) {
    if (nodes.size >= 30) {
      continue;
    }
    const gid = group.toString();
    nodes.add(id);
    graph.boxes[id] = {
      id,
      name: id,
      x: Math.round(Math.random() * W),
      y: Math.round(Math.random() * H),
      context: undefined,
      width: 20,
      height: 20,
    };
    if (!groups.has(gid) && groups.size < 10) {
      const i = groups.size;
      groups.add(gid);
      graph.contexts[gid] = {
        name: gid,
        color: defaultContextColor(i)
          .alpha(0.8)
          .string(),
        seq: i,
        visible: true,
      };
    }
    if (groups.has(gid)) {
      graph.boxes[id].context = gid;
    }
  }
  graph.arrows = data.links
    .filter(({ source, target }) => nodes.has(source) && nodes.has(target))
    .map(({ source, target }) => ({
      id: `${source}|${target}`,
      source,
      target,
    }));
  console.log(graph.arrows);
  return graph;
}
