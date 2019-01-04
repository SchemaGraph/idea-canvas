import React, {
  FunctionComponent,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import useComponentSize from '@rehooks/component-size';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { zoom as d3Zoom, ZoomBehavior, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';

import { Zoom } from '../../models/store';
import { connect, useConditionalEffect } from '../../utils';
import { TOOL_ADD_NODE } from '../toolbar/constants';

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
      handler(require('d3-selection').event.transform);
    });
}

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
  const { k: scale, x: offsetX, y: offsetY } = z;
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

interface Props {
  setZoom?: (t: Zoom) => void;
  setCanvasDimensions?: (w: number, h: number) => void;
  onCanvasClick?: React.MouseEventHandler<HTMLDivElement>;
  tool?: string;
  toolbarZoom?: Zoom;
}
type FinalProps = Props & React.HTMLAttributes<HTMLDivElement>;

const ZoomCanvasBase: FunctionComponent<FinalProps> = ({
  setZoom,
  setCanvasDimensions,
  tool,
  toolbarZoom,
  onCanvasClick,
  children,
}) => {
  if (!setZoom || !setCanvasDimensions || !toolbarZoom) {
    return null;
  }
  const outerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const zoomBehavior = useRef<ZoomBehavior<any, any> | null>(null);
  const lastZoom = useRef<Zoom | null>(null);

  const { width, height } = useComponentSize(outerRef);

  console.log('ZOOM-CANVAS ROOT');
  useEffect(
    () => {
      console.log('ZOOM-CANVAS SETCANVASDIMENSIONS');
      setCanvasDimensions(width, height);
    },
    [width, height]
  );

  // attach d3 zoom behavior
  useEffect(() => {
    const c = outerRef.current;
    const m = mainRef.current;
    if (c && m) {
      const z = getZoomBehavior(new Set([c, m]), (t: Zoom) => {
        setZoom(t);
        lastZoom.current = t;
        const transform = getScaleStyle(t);
        select(m).style('transform', transform.transform);
      });
      select(c).call(z);
      zoomBehavior.current = z;
    }
  }, []);

  // Sync zoomBehavior with external zoom action
  useConditionalEffect(
    (c, t, z) => {
      const { k, x, y } = toolbarZoom;
      if (k !== t.k || x !== t.x || y !== t.y) {
        setZoom(toolbarZoom);
        select(c)
          .transition()
          .duration(100)
          .call(z.transform, zoomIdentity.translate(x, y).scale(k));
      }
    },
    [() => outerRef.current, () => lastZoom.current, () => zoomBehavior.current],
    [toolbarZoom, setZoom]
  );

  const clickHandler = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    e => {
      if (
        (e.target === outerRef.current || e.target === mainRef.current) &&
        onCanvasClick
      ) {
        // TODO: For some reason we get a click here
        // when a node is clicked in in the focus view
        // console.log(e.nativeEvent);
        onCanvasClick(e);
      }
    },
    [onCanvasClick]
  );

  return (
    <OuterContainer innerRef={outerRef} tool={tool} onClick={clickHandler}>
      <MainContainer innerRef={mainRef} tool={tool}>
        {children}
      </MainContainer>
    </OuterContainer>
  );
};

export const ZoomCanvas = connect<FinalProps>(
  ({ setCanvasDimensions, setZoom, tool, toolbarZoom }, _props) => ({
    setCanvasDimensions,
    setZoom,
    tool,
    toolbarZoom, // only used to subsribe to updates caused by the toolbar
  })
)(observer(ZoomCanvasBase));
