import { values } from 'mobx';
import { onAction, types } from 'mobx-state-tree';
import v4 from 'uuid/v4';
import { arrows, Box, boxes, BoxRef, IBox } from './components/models';

export function randomUuid() {
  return v4();
}

const SelectionType = types.maybeNull(BoxRef);

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
      return values(self.boxes).find(box => box.selected === true) as
        | IBox
        | undefined;
    },
    get zoom(): Zoom {
      const {scale, offsetX, offsetY} = self;
      // console.log('getZoom', scale, offsetX, offsetY);
      return {
        scale,
        offsetX,
        offsetY,
      };
    },
  }))
  .actions(self => ({
    addBox(name: string, x: number, y: number) {
      const box = Box.create({ name, x, y, id: randomUuid(), selected: false });
      self.boxes.put(box);
      return box;
    },
    addArrow(from: any, to: any) {
      self.arrows.push({ id: randomUuid(), from, to });
    },
    setDragging(dragging: any) {
      self.dragging = dragging;
    },
    setZoom(z: Zoom) {
      const {scale, offsetX, offsetY} = z;
      // console.log('setZoom', scale, offsetX, offsetY);
      self.scale = scale;
      self.offsetX = offsetX;
      self.offsetY = offsetY;
    },
    setTool(tool: string) {
      console.log(tool.toUpperCase());
      self.tool = tool;
    },
    setCanvasDimensions(w: number, h: number) {
      self.canvasWidth = w;
      self.canvasHeight = h;
    },
    clearSelection(except?: IBox) {
      values(self.boxes).map(
        box =>
          box.selected &&
          (!except || except.id !== box.id) &&
          box.setSelected(false)
      );
    },
  }))
  .actions(self => ({
    createBox(name: string, x?: number, y?: number) {
      const xx = x || (self.canvasWidth / 2 - 37 - self.offsetX) / self.scale;
      const yy = y || (50 - self.offsetY) / self.scale;
      const box = self.addBox(name, xx, yy);
      const source = self.selection;
      if (source) {
        self.addArrow(source.id || source, box.id);
      }
      self.clearSelection();
      box.setSelected(true);
    },
  }));

/*
    The store that holds our domain: boxes and arrows
*/
export const store = Store.create({
  boxes: {
    'ce9131ee-f528-4952-a012-543780c5e66d': {
      id: 'ce9131ee-f528-4952-a012-543780c5e66d',
      name: 'Rotterdam',
      x: 100,
      y: 150,
      selected: false,
    },
    '14194d76-aa31-45c5-a00c-104cc550430f': {
      id: '14194d76-aa31-45c5-a00c-104cc550430f',
      name: 'Bratislava',
      x: 200,
      y: 300,
      selected: false,
    },
  },
  arrows: [
    {
      id: '7b5d33c1-5e12-4278-b1c5-e4ae05c036bd',
      from: 'ce9131ee-f528-4952-a012-543780c5e66d',
      to: '14194d76-aa31-45c5-a00c-104cc550430f',
    },
  ],
});

onAction(store.boxes, data => {
  const {name, args, path} = data;
  if (!name || !args || !path) {
    return;
  }
  if(name === 'setSelected' && args[0] === true) {
    const components = path.split('/');
    const box = store.boxes.get(components[1]);
    if (box) {
      store.clearSelection(box);
    }
  }
  // console.log(data);
});

export type IStore = typeof Store.Type;
export type IStoreSnapshot = typeof Store.SnapshotType;
export interface IStores {
  store: IStore;
}
