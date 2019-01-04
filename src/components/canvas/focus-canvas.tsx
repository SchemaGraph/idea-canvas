import React, { FunctionComponent, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { values } from 'mobx';
import { select } from 'd3-selection';
import { ForceLink } from 'd3-force';

import { IStore, INITIAL_BOX_ID } from '../../models/store';
import { connect, useConditionalEffect } from '../../utils';
import { MarkerArrowDef, MarkerSelectedArrowDef } from '../node/arrow-view';
import { FastArrowView, arrowPath } from '../node/fast-arrow-view';
import { ConnectingArrowView } from '../node/connecting-arrow-view';
import { NodeView } from '../node/node-view';
import {
  GraphSimulation,
  SimulationNode,
  SimulationLink,
  getFocusSimulation,
  updateOnEnd,
} from '../../force-layout';
import { CircleView } from '../node/circle-view';
import { FastBoxView } from '../node/fast-box-view';
import { IBox, IArrow } from '../../models/models';

function layerStyles() {
  return `
    position: absolute;
    transform-origin: 0 0;
    overflow: visible;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  `;
}

const SvgLayer = styled.svg`
  ${layerStyles()};
  width: 2px;
  height: 2px;
`;

interface Props {
  store?: IStore;
}

const FocusCanvasBase: FunctionComponent<Props> = ({ store }) => {
  if (!store || !store.focusGraph) {
    return null;
  }
  const {
    focusGraph,
    connecting,
    canvasWidth: width,
    canvasHeight: height,
    circles,
    editing,
    undoManager: undo,
  } = store;
  const { graph, focus: selectedNode } = focusGraph;

  if (width <= 0 || height <= 0 || !focusGraph) {
    return null;
  }
  const { boxes: boxesMap, arrows } = graph;
  const boxes: IBox[] = [selectedNode].concat(
    values(boxesMap).filter(b => b.id !== selectedNode.id)
  );
  // const boxIds = new Set(boxes.map(b => b.id));
  // const arrowBoxIds = new Set(arrows.map(b => b.source.id).concat(arrows.map(b => b.target.id)));
  // console.log(boxIds, arrowBoxIds);
  const svgRef = useRef<SVGElement>(null);
  const simulationStarted = useRef<number>(0);

  const Node = circles ? CircleView : FastBoxView;
  const nodeProps = { measureHeight: !circles, measureWidth: !circles };

  useConditionalEffect(
    svg => {
      simulationStarted.current = 1;
      console.log('FOCuSSImulation');

      const { simulation, links } = getFocusSimulation(
        boxes,
        arrows,
        width,
        height
      );
      runD3Simulation(svg, updateOnEnd(simulation, graph, undo), links);
    },
    [() => svgRef.current],
    [focusGraph]
  );

  return (
    <>
      <SvgLayer innerRef={svgRef}>
        <defs>
          <MarkerArrowDef />
          <MarkerSelectedArrowDef />
        </defs>
        {arrows.map(arrow => (
          <FastArrowView
            arrow={arrow}
            key={arrow.id}
            data-linkid={linkId(arrow)}
          />
        ))}
        {connecting && <ConnectingArrowView arrow={connecting} />}
      </SvgLayer>
      {boxes
        .filter(box => isVisible(box) && editing !== box.id)
        .map(box => (
          <NodeView box={box} key={box.id} {...nodeProps}>
            <Node box={box} key={box.id} data-nodeid={box.id} />
          </NodeView>
        ))}
    </>
  );
};

function isVisible({ context }: IBox) {
  return !context || (context && context.visible);
}

function linkId({
  source,
  target,
}:
  | { source: { id: string }; target: { id: string } }
  | { source: string; target: string }) {
  if (typeof source === 'string' && typeof target === 'string') {
    return `${source}|${target}`;
  }
  if (typeof source === 'object' && typeof target === 'object') {
    return `${source.id}|${target.id}`;
  }
  return 'unknown|unknown';
}

export const FocusCanvas = connect<Props>((store, props) => ({
  store,
  ...props,
}))(observer(FocusCanvasBase));

function runD3Simulation(
  svg: SVGElement,
  simulation: GraphSimulation,
  links: SimulationLink[]
) {
  const nodes = simulation.nodes();
  // const linkForce = simulation.force<ForceLink<SimulationNode, SimulationLink>>(
  //   'link'
  // );
  // if (!linkForce) {
  //   return;
  // }
  // const links = linkForce.links();
  const s = select(svg);
  console.log(links);
  const node = select(svg.parentElement)
    .selectAll<HTMLDivElement, SimulationNode>('div[class^="node-"]')
    .data(nodes, function(d) {
      return d || !this ? d.id : this.dataset.nodeid!;
    });
  const link = s
    .selectAll<SVGPathElement, SimulationLink>('path')
    .data(links, function(d) {
      return d ? linkId(d as any) : this.dataset.linkid!;
    });

  simulation.on('tick', () => {
    link.attr('d', function(d) {
      return arrowPath(d.source as any, d.target as any);
    });
    node.style('transform', ({ x, y }) => `translate(${x}px,${y}px)`);
  });
}
