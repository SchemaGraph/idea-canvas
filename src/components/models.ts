import { types } from 'mobx-state-tree';

export const Box = types
  .model('Box', {
    id: types.identifier,
    name: 'hal',
    x: 0,
    y: 0,
    selected: types.optional(types.boolean, false),
  })
  .views(self => ({
    get width() {
      return self.name.length * 15;
    },
  }))
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
  }));
export type IBox = typeof Box.Type;
export const BoxRef = types.reference(Box);
export type IBoxRef = typeof BoxRef;
export const Arrow = types.model('Arrow', {
  id: types.identifier,
  from: types.reference(Box),
  to: types.reference(Box),
});
export type IArrow = typeof Arrow.Type;
export const boxes = types.map(Box);
export const arrows = types.array(Arrow);

export type IBoxes = typeof boxes.Type;
export type IArrows = typeof arrows.Type;
