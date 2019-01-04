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
} from '../../force-layout';
import { CircleView } from '../node/circle-view';
import { FastBoxView } from '../node/fast-box-view';
import { EditBoxView } from '../edit-box-view';
import { IBox } from '../../models/models';

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

const SimulationCanvasBase: FunctionComponent<Props> = ({ store }) => {
  if (!store) {
    return null;
  }
  const {
    graph,
    connecting,
    canvasWidth: width,
    canvasHeight: height,
    circles,
    simulation,
    editing,
    initialBox,
  } = store;

  if (width <= 0 || height <= 0) {
    return null;
  }
  const svgRef = useRef<SVGElement>(null);
  const simulationStarted = useRef<number>(0);

  const { boxes, arrows } = graph;
  const Node = circles ? CircleView : FastBoxView;

  useConditionalEffect(
    (svg, simulation) => {
      simulationStarted.current = 1;
      runD3Simulation(svg, simulation);
    },
    [svgRef.current, simulation],
    [simulation]
  );

  const editBox = editing
    ? editing === INITIAL_BOX_ID
      ? initialBox
      : boxes.get(editing)
    : undefined;

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
        {/* {values(boxes).map(box => (
          <NodeView box={box} key={box.id} measureWidth measureHeight>
            <SvgCircleView box={box} key={box.id} data-nodeid={box.id} />
          </NodeView>
        ))} */}
      </SvgLayer>
      {values(boxes)
        .filter(box => isVisible(box) && editing !== box.id)
        .map(box => (
          <NodeView box={box} key={box.id} measureWidth measureHeight>
            <Node box={box} key={box.id} data-nodeid={box.id} />
          </NodeView>
        ))}
      {editBox && <EditBoxView box={editBox} />}
    </>
  );
};

function isVisible({ context }: IBox) {
  return !context || (context && context.visible);
}

function linkId(arrow: { source: { id: string }; target: { id: string } }) {
  return `${arrow.source.id}|${arrow.target.id}`;
}

export const SimulationCanvas = connect<Props>((store, _props) => ({
  store,
}))(observer(SimulationCanvasBase));

function runD3Simulation(svg: SVGElement, simulation: GraphSimulation) {
  const nodes = simulation.nodes();
  const linkForce = simulation.force<ForceLink<SimulationNode, SimulationLink>>(
    'link'
  );
  if (!linkForce) {
    return;
  }
  const links = linkForce.links();
  const s = select(svg);

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

    // node
    //   .attr('cx', d => d.x! + d.width! / 2)
    //   .attr('cy', d => d.y! + d.width! / 2);
  });
}
