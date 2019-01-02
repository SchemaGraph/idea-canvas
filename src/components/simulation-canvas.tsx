import React, { FunctionComponent, useRef, useEffect, useMemo } from 'react';
import useComponentSize from '@rehooks/component-size';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { values } from 'mobx';
import {
  zoom as d3Zoom,
  ZoomBehavior,
  zoomIdentity,
  ZoomTransform,
} from 'd3-zoom';
import { select } from 'd3-selection';
import { ForceLink } from 'd3-force';

import { IStore, Zoom } from '../models/store';
import { connect } from '../utils';
import { TOOL_ADD_NODE } from './toolbar/constants';
import { MarkerArrowDef, MarkerSelectedArrowDef } from './arrow-view';
import { FastArrowView, arrowPath } from './fast-arrow-view';
import { ConnectingArrowView } from './connecting-arrow-view';
import { NodeView } from './node-view';
import { SvgCircleView } from './circle-view-svg';
import {
  GraphSimulation,
  getForceSimulation,
  SimulationNode,
  SimulationLink,
  updateOnEnd,
} from '../force-layout';

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

interface WithTool {
  tool?: string;
}

function toolToCursor(tool?: string) {
  if (tool === TOOL_ADD_NODE) {
    return 'crosshair';
  }
  return 'auto';
}

function getScaleStyle(z: Zoom) {
  const { scale, offsetX, offsetY } = z;
  return {
    transform: `translate(${offsetX}px,${offsetY}px) scale(${scale})`,
  };
}

const OuterContainer = styled.div`
  ${layerStyles()};
  cursor: ${({ tool }: WithTool) => toolToCursor(tool)};
`;

const MainContainer = styled.div`
  ${layerStyles()};
  cursor: ${({ tool }: WithTool) => toolToCursor(tool)};
`;

const SvgLayer = styled.svg`
  ${layerStyles()};
  width: 2px;
  height: 2px;
`;

interface Props {
  store?: IStore;
}

const SimulationCanvasBase: FunctionComponent<Props> = ({ store }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGElement>(null);
  const numRenders = useRef<number>(1);
  const simulationStarted = useRef<number>(0);
  const zoomBehavior = useRef<ZoomBehavior<any, any> | null>(null);
  const lastZoom = useRef<Zoom | null>(null);

  const { width, height } = useComponentSize(outerRef);

  useEffect(() => {
    numRenders.current += 1;
  });
  if (!store || (outerRef.current && (height < 10 || width < 10))) {
    return null;
  }

  useEffect(
    () => {
      store.setCanvasDimensions(width, height);
    },
    [width, height]
  );

  useEffect(() => {
    const c = outerRef.current;
    const m = mainRef.current;
    if (c && m) {
      const z = getZoomBehavior(new Set([c, m]), (t: Zoom) => {
        store.setZoom(t);
        lastZoom.current = t;
      });
      select(c).call(z as any);
      zoomBehavior.current = z;
    }
  }, []);

  const { graph, zoom, connecting, tool, undoManager } = store;

  useEffect(() => {
    const c = outerRef.current;
    const t = lastZoom.current;
    const z = zoomBehavior.current;
    if (c && t && z) {
      const { scale, offsetX, offsetY } = zoom;

      if (scale !== t.scale || offsetX !== t.offsetX || offsetY !== t.offsetY) {
        // Error appeared with updated typings
        z.transform(
          select(c) as any,
          zoomIdentity.translate(offsetX, offsetY).scale(scale)
        );
      }
    }
  });

  const { boxes, arrows } = graph;
  useEffect(
    () => {
      if (boxes.size > 0 && svgRef.current) {
        simulationStarted.current = 1;
        // const links = arrows.map((b: IArrow) => ({ ...getSnapshot(b, false) }));
        const simulation = updateOnEnd(
          getForceSimulation(graph, width, height),
          graph,
          undoManager
        );
        store.setSimulation(simulation);
        runD3Simulation(svgRef.current, simulation);
      }
    },
    [boxes.size]
  );

  return (
    <OuterContainer innerRef={outerRef} tool={tool}>
      <MainContainer style={getScaleStyle(zoom)} innerRef={mainRef} tool={tool}>
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
          {values(boxes).map(box => (
            <NodeView
              box={box}
              key={box.id}
              zoom={zoom}
              measureWidth
              measureHeight
            >
              <SvgCircleView
                box={box}
                key={box.id}
                zoom={zoom}
                data-nodeid={box.id}
              />
            </NodeView>
          ))}
        </SvgLayer>
      </MainContainer>
    </OuterContainer>
  );
};

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
  const node = s
    .selectAll<SVGCircleElement, SimulationNode>('circle')
    .data(nodes, function(d) {
      return d ? d.id : this.dataset.nodeid!;
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

    node
      .attr('cx', d => d.x! + d.width! / 2)
      .attr('cy', d => d.y! + d.width! / 2);
  });
}

const allowedZoomEvents = new Set([
  'mousedown',
  'wheel',
  'dblclick',
  'touchstart',
  'touchend',
  'touchmove',
]);

function getZoomBehavior(
  targets: Set<HTMLDivElement>,
  handler: (t: Zoom) => void
) {
  return d3Zoom<HTMLDivElement, {}>()
    .scaleExtent([0.1, 5])
    .filter(() => {
      const event = require('d3-selection').event;
      if (allowedZoomEvents.has(event.type) && !targets.has(event.target)) {
        return false;
      }
      return !event.button;
    })
    .on('zoom', () => {
      handler(zoomTransformToZoom(require('d3-selection').event.transform));
    });
}

function zoomTransformToZoom(zt: { x: number; y: number; k: number }): Zoom {
  return {
    scale: zt.k,
    offsetX: zt.x,
    offsetY: zt.y,
  };
}
