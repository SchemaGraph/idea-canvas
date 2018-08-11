import { values } from 'mobx';
import { applyPatch, onAction, types } from 'mobx-state-tree';
import v4 from 'uuid/v4';
import {
  combineEntries,
  deserializeEntries,
  MyApolloClient,
} from './appsync/client';
import {
  Arrow,
  arrows,
  Box,
  boxes,
  BoxRef,
  IArrow,
  IBox,
} from './components/models';
import { PatchManager } from './patch-manager';

export function randomUuid() {
  return v4();
}

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
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    tool: 'none',
    canvasWidth: -1,
    canvasHeight: -1,
  })
  .views(self => ({
    get selection() {
      const all = values(self.boxes).concat(self.arrows);
      return all.find(box => box.selected === true) as
        | IBox
        | IArrow
        | undefined;
    },
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
      const box = Box.create({ name, x, y, id: randomUuid(), selected: false });
      self.boxes.put(box);
      return box;
    },
    removeBox(box: IBox) {
      const arrow = self.arrows.find(
        a => a.to.id === box.id || a.from.id === box.id
      );
      if (arrow) {
        self.arrows.remove(arrow);
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
    setTool(tool: string) {
      // console.log(tool.toUpperCase());
      self.tool = tool;
    },
    setCanvasDimensions(w: number, h: number) {
      self.canvasWidth = w;
      self.canvasHeight = h;
    },
    clearSelection(except?: IBox | IArrow) {
      values(self.boxes).map(
        box =>
          box.selected &&
          (!except || except.id !== box.id) &&
          box.setSelected(false)
      );
      self.arrows.map(
        arrow =>
          arrow.selected &&
          (!except || except.id !== arrow.id) &&
          arrow.setSelected(false)
      );
    },
  }))
  .actions(self => ({
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
    addArrow(from: any, to: any) {
      const existing = self.arrows.find(a => a.from === from && a.to === to);
      if (existing) {
        return;
      }
      const arrow = Arrow.create({
        id: randomUuid(),
        from,
        to,
        selected: false,
      });
      self.arrows.push(arrow);
      self.clearSelection();
    },
  }))
  .actions(self => ({
    createBox(name?: string, x?: number, y?: number) {
      const xx = x || (self.canvasWidth / 2 - 37 - self.offsetX) / self.scale;
      const yy = y || (50 - self.offsetY) / self.scale;
      const box = self.addBox(xx, yy, name);
      const source = self.selection;
      if (source) {
        self.addArrow(source.id || source, box.id);
      }
      self.clearSelection();
      box.setSelected(true);
    },
    // init: flow<ApolloQueryResult<getGraph>>(function* init() {
    //   const { data, errors }: ApolloQueryResult<getGraph> = yield getPatches();
    //   // console.log(result);

    //   // if (!errors && data.getGraph && data.getGraph.patches) {
    //   //   onPatch(self, ({ path, value }) => {
    //   //     const parts = path.split('/');
    //   //     const last = parts.pop();
    //   //     console.log(last, value);
    //   //   });
    //   //   try {
    //   //     const patches = toJsonPatches(data.getGraph.patches);
    //   //     const firstAdd = patches.findIndex(p => p.op === 'add');
    //   //     if (firstAdd > -1) {
    //   //       applyPatch(self, patches.slice(firstAdd));
    //   //     }

    //   //   } catch (e) {
    //   //     console.error(e);
    //   //   }
    //   // }

    //   // return result;
    //   // return undefined;
    // }),
  }));

export const store = Store.create();
export const client = new MyApolloClient();

export async function init(graphId: string) {
  const {
    data: { getGraph },
  } = await client.getGraph(graphId);
  if (!getGraph) {
    const r = await client.createGraph(graphId);
    console.log('INIT CREATE', r);
  }
  let initialVersion = 0;
  if (getGraph && getGraph.patches && getGraph.patches.length > 0) {
    const { entries, version } = deserializeEntries(getGraph.patches);
    initialVersion = version;
    // const patches = combineEntries(entries);
    applyPatch(store, combineEntries(entries));
    // console.log('INIT', initialVersion, patches);
    // patches.map(p => {
    //   try {
    //     applyPatch(store, p);
    //     console.log('APPLIED', p);
    //   } catch (error) {
    //     console.log('FAILED TO APPLY', p);
    //   }
    //   return 1;
    // });
  }
  return new PatchManager(store, client, graphId, initialVersion);
}

// store
//   .init()
//   .then(_r => {
//     // PatchManager.create({}, { targetStore: store });

//     // subscribeToPatches().subscribe(
//     //   ({ data }) => {
//     //     const remotePatches = data.onAddPatches;
//     //     if (remotePatches) {
//     //       // const patches = toJsonPatches(data.getGraph.patches);
//     //       // console.log(data.getGraph.patches);
//     //       // const newOnes = remotePatches.filter(({id}) => !applied.has(id));
//     //       applyPatch(store, toJsonPatches(remotePatches));
//     //     }
//     //     console.log('SUBSCRIBE RESULT', remotePatches);
//     //   },
//     //   e => {
//     //     console.log('SUBSCRIBE ERROR', e);
//     //   }
//     // );

//   })
//   .catch(console.log);

onAction(store.boxes, data => {
  const { name, args, path } = data;
  if (!name || !args || !path) {
    return;
  }
  if (name === 'setSelected' && args[0] === true) {
    const components = path.split('/');
    const { boxes: b, selection, clearSelection, tool, addArrow } = store;
    const box = b.get(components[1]);
    const currentBox = selection && b.get(selection.id);
    if (box) {
      if (tool === 'connect' && currentBox) {
        addArrow(currentBox, box);
      } else {
        clearSelection(box);
      }
    }
  }
  // console.log(data);
});

onAction(store.arrows, data => {
  const { name, args, path } = data;
  if (!name || !args || !path) {
    return;
  }
  if (name === 'setSelected' && args[0] === true) {
    const components = path.split('/');
    const arrow = store.arrows[Number(components[1])];
    // const arrow = store.arrows.find(a => a.id === components[1]);
    if (arrow) {
      store.clearSelection(arrow);
    }
  }
  console.log(data);
});

export type IStore = typeof Store.Type;
export type IStoreSnapshot = typeof Store.SnapshotType;
export interface IStores {
  store: IStore;
}
