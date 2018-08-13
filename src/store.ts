import { values } from 'mobx';
import { applyPatch, onAction, types } from 'mobx-state-tree';
import {
  deserializeRemotePatches,
  flattenPatches,
  MyApolloClient,
} from './appsync/client';
import {
  Arrow,
  ArrowRef,
  arrows,
  Box,
  boxes,
  BoxRef,
  IArrow,
  IBox,
} from './components/models';
import {
  TOOL_ADD_NODE,
  TOOL_CONNECT,
  TOOL_PAN,
} from './components/toolbar/constants';
import { PatchManager } from './patch-manager';
import { uuid } from './utils';

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

export const Store = types
  .model('Store', {
    boxes,
    arrows,
    dragging: SelectionType,
    selection: SelectionType,
    editing: SelectionType,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    tool: 'none',
    canvasWidth: -1,
    canvasHeight: -1,
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
  }))
  .actions(self => ({
    setTool(tool: string) {
      console.log(tool.toUpperCase());
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
      const existing = self.arrows.find(a => a.from.id === from && a.to.id === to);
      if (existing) {
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
      if (tool !== TOOL_ADD_NODE && tool !== TOOL_PAN) {
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
    },
  }));

export async function load(
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

export type IStore = typeof Store.Type;
export type IStoreSnapshot = typeof Store.SnapshotType;
export interface IStores {
  store: IStore;
}
