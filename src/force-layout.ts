import {
  forceSimulation,
  forceManyBody,
  forceX,
  forceY,
  forceLink,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { Box, Arrow, IBox, IArrow } from './models/models';
import { IGraph } from './models/graph-store';
import { UndoManager } from './models/undo-manager';
import { values } from 'mobx';
import { getSnapshot } from 'mobx-state-tree';

export type SimulationNode = typeof Box.CreationType & SimulationNodeDatum;
export type SimulationLink = typeof Arrow.CreationType &
  SimulationLinkDatum<SimulationNode>;
export type GraphSimulation = Simulation<SimulationNode, SimulationLink>;

let currentSimulation: GraphSimulation | undefined;

export function getForceSimulation(
  graph: IGraph,
  width: number,
  height: number,
  undo: UndoManager
): GraphSimulation {
  const nodes = values(graph.boxes).map((b: IBox) => ({
    ...getSnapshot(b, false),
  }));
  if (currentSimulation) {
    currentSimulation.stop();
  }
  const links = graph.arrows.map((b: IArrow) => ({ ...getSnapshot(b, false) }));
  const simulation = (currentSimulation = forceSimulation<
    SimulationNode,
    SimulationLink
  >(nodes)
    .alphaMin(0.1)
    .force(
      'link',
      forceLink<SimulationNode, SimulationLink>(links)
        .id(d => d.id)
        .distance(() => 120)
    )
    .force('charge', forceManyBody().strength(() => -720))
    .force('x', forceX(width / 2))
    .force('y', forceY(height / 2)));

  // undo.startGroup();
  let ticks = 0;
  simulation.on('tick', () => {
    // console.log('tick');
    ticks++;
    for (const { x, y, id } of simulation.nodes()) {
      const node = graph.boxes.get(id);
      if (node && x && y) {
        // console.log(id, x - node.x, y - node.y, fx, fy);
        undo.withoutUndo(() => node.move(x - node.x, y - node.y));
      }
    }
  });
  simulation.on('end', () => {
    console.log('simulation ended', ticks);
    ticks = 0;
    // undo.stopGroup();
  });
  return simulation;
}
