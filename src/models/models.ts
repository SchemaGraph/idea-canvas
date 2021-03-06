import { types } from 'mobx-state-tree';

export const INITIAL_WIDTH = 100;
export const INITIAL_HEIGHT = 60;

export const Context = types
  .model('Context', {
    name: types.identifier,
    seq: types.number,
    color: types.string,
    visible: true,
  })
  .actions(self => ({
    setVisible(v: boolean) {
      self.visible = v;
    },
  }));

export type IContext = typeof Context.Type;
export const Contexts = types.map(Context);
export type IContexts = typeof Contexts.Type;

export const Box = types
  .model('Box', {
    id: types.identifier,
    name: types.maybe(types.string),
    context: types.maybe(types.reference(Context)),
    x: 0,
    y: 0,
    width: 20,
    height: 20,
  })
  .actions(self => ({
    move(dx: number, dy: number) {
      self.x += dx;
      self.y += dy;
    },
    setName(newName?: string) {
      self.name = newName;
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
    setContext(c?: IContext) {
      self.context = c;
    },
  }));
export type IBox = typeof Box.Type;
export const BoxRef = types.reference(Box);
export type IBoxRef = typeof BoxRef;
export const Arrow = types.model('Arrow', {
  id: types.identifier,
  source: types.reference(Box),
  target: types.reference(Box),
});

export type IArrow = typeof Arrow.Type;
export const ArrowRef = types.reference(Arrow);
export const Boxes = types.map(Box);
export const Arrows = types.array(Arrow);

export type IBoxes = typeof Boxes.Type;
export type IArrows = typeof Arrows.Type;

export const ConnectingArrow = types.model('ConnectingArrow', {
  from: types.reference(Box),
  toX: types.number,
  toY: types.number,
  to: types.maybeNull(types.reference(Box)),
  intersectionX: types.maybeNull(types.number),
  intersectionY: types.maybeNull(types.number),
  distance: types.maybeNull(types.number),
});
export type IConnectingArrow = typeof ConnectingArrow.Type;
