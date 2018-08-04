import { types } from 'mobx-state-tree';

export const Box = types
  .model('Box', {
    id: types.identifier,
    name: 'hal',
    x: 0,
    y: 0,
    selected: types.optional(types.boolean, false),
    width: 100,
    height: 60,
  })
  .actions(self => ({
    move(dx: number, dy: number) {
      self.x += dx;
      self.y += dy;
    },
    setName(newName: string) {
      self.name = newName;
    },
    setSelected(selected: boolean) {
      self.selected = selected;
    },
    setDimensions(w: number, h: number) {
      self.width = w;
      self.height = h;
    },
    setWidth(w: number) {
      self.width = w;
    },
    setHeight(h: number) {
      self.height = h;
    },
  }));
export type IBox = typeof Box.Type;
export const BoxRef = types.reference(Box);
export type IBoxRef = typeof BoxRef;
export const Arrow = types
  .model('Arrow', {
    id: types.identifier,
    from: types.reference(Box),
    to: types.reference(Box),
    selected: types.optional(types.boolean, false),
  })
  .actions(self => ({
    setSelected(selected: boolean) {
      self.selected = selected;
    },
  }));
export type IArrow = typeof Arrow.Type;
export const boxes = types.map(Box);
export const arrows = types.array(Arrow);

export type IBoxes = typeof boxes.Type;
export type IArrows = typeof arrows.Type;
