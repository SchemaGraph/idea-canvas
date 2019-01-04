import {
  forceSimulation,
  forceManyBody,
  forceX,
  forceY,
  forceLink,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
  forceCenter,
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
  height: number
): GraphSimulation {
  const nodes = values(graph.boxes).map(
    (b: IBox) =>
      ({
        ...getSnapshot(b, false),
        context: b.context ? getSnapshot(b.context, false) : undefined,
      } as SimulationNode)
  );
  if (currentSimulation) {
    currentSimulation.stop();
  }
  const links = graph.arrows.map(
    (b: IArrow) => ({ ...getSnapshot(b, false) } as SimulationLink)
  );

  const lf = forceLink<SimulationNode, SimulationLink>(links)
    .id(d => d.id)
    .distance(() => 60);
  // const strength = lf.strength();
  // lf.strength((l, i, ls) => strength(l, i, ls) * 0.001);

  const simulation = (currentSimulation = forceSimulation<
    SimulationNode,
    SimulationLink
  >(nodes)
    .alphaMin(0.1)
    .force('link', lf)
    .force('charge', forceManyBody().strength(() => -500))
    .force('x', forceX(width / 2))
    .force('y', forceY(height / 2)));

  // undo.startGroup();
  return simulation;
}

export function getFocusSimulation(
  boxes: IBox[], // assume the focus is on the box at index 0
  arrows: IArrow[],
  width: number,
  height: number
) {
  const origo = [width / 2, height / 2];
  const nodes = boxes.map(
    (b: IBox) =>
      ({
        ...getSnapshot(b, false),
        context: b.context ? getSnapshot(b.context, false) : undefined,
      } as SimulationNode)
  );
  const links = arrows.map(
    (b: IArrow) =>
      ({
        ...getSnapshot(b, false),
        // target: getSnapshot(b.target, false),
        // source: getSnapshot(b.source, false),
      } as SimulationLink)
  );

  // Fix into origo
  const s = nodes[0];
  s.fx = origo[0] - (s.width || 0) / 2;
  s.fy = origo[1] - (s.height || 0) / 2;

  if (currentSimulation) {
    currentSimulation.stop();
  }

  const lf = forceLink<SimulationNode, SimulationLink>(links)
    .id(d => d.id)
    .distance(() => 120);

  const simulation = (currentSimulation = forceSimulation<
    SimulationNode,
    SimulationLink
  >(nodes)
    .alphaMin(0.1)
    .force('link', lf)
    .force('charge', forceManyBody().strength(() => -100))
    //    .force('center', forceCenter(...origo)));
    .force('x', forceX(width / 2))
    .force('y', forceY(height / 2)));

  // const strength = lf.strength();
  // lf.strength((l, i, ls) => strength(l, i, ls) * 0.001);
  // this modifies the links and is needed if the
  // link force is not attached to the simulation
  // lf.initialize(nodes);

  return {
    simulation,
    links,
  };
}

export function attachSimulationToGraph(
  simulation: GraphSimulation,
  graph: IGraph,
  undo: UndoManager
) {
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

export function updateOnEnd(
  simulation: GraphSimulation,
  graph: IGraph,
  withoutUndo?: (a: () => void) => void
) {
  simulation.on('end', () => {
    console.log('updateOnEnd');
    if (withoutUndo) {
      withoutUndo(() => graph.batchMove(simulation.nodes()));
    } else {
      graph.batchMove(simulation.nodes());
    }
  });
  return simulation;
}
