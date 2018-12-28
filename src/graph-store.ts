import { types } from 'mobx-state-tree';
import {
  Arrow,
  Arrows,
  Box,
  Boxes,
  Context,
  Contexts,
  IArrow,
  IBox,
} from './components/models';
import { defaultContextColor } from './theme/theme';
import { uuid } from './utils';

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

export const Graph = types
  .model('Graph', {
    boxes: Boxes,
    arrows: Arrows,
    contexts: Contexts,
  })
  .actions(self => ({
    addBox(x: number, y: number, name?: string) {
      const box = Box.create({
        name,
        x,
        y,
        id: uuid(),
        initialized: name ? true : false,
      });
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
    addContext(name: string, customColor?: string, assignTo?: IBox) {
      const existing = self.contexts.get(name);
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
  }));
export type IGraph = typeof Graph.Type;
export type IGraphSnapshot = typeof Graph.SnapshotType;

export function emptyGraph(): IGraphSnapshot {
  return {
    boxes: {},
    arrows: [],
    contexts: {},
  };
}
