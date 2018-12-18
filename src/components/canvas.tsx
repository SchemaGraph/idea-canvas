import { select, ValueFn, Selection } from 'd3-selection';
import {
  zoom as d3Zoom,
  ZoomBehavior,
  zoomIdentity,
  ZoomTransform,
} from 'd3-zoom';
import { values } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { IStore, Zoom } from '../store';
import { connect } from '../utils';
import {
  ArrowView,
  MarkerArrowDef,
  MarkerSelectedArrowDef,
} from './arrow-view';
import { BoxView } from './box-view';
import { ConnectingArrowView } from './connecting-arrow-view';
import { INITIAL_HEIGHT, INITIAL_WIDTH, IBox } from './models';
import { TOOL_ADD_NODE, TOOL_NONE } from './toolbar/constants';

function zoomTransformToZoom(zt: { x: number; y: number; k: number }): Zoom {
  return {
    scale: zt.k,
    offsetX: zt.x,
    offsetY: zt.y,
  };
}
interface Props {
  store?: IStore;
  tool?: string;
  editing?: string | null;
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

const OuterContainer = styled.div`
  ${layerStyles()};
  cursor: ${({ tool }: WithTool) => toolToCursor(tool)};
  /* border: 1px solid red; */
`;

const MainContainer = styled.div`
  ${layerStyles()};
  cursor: ${({ tool }: WithTool) => toolToCursor(tool)};
  /* border: 1px solid blue; */
  /* transition: transform 0.2s ease-out; */
`;

const SvgLayer = styled.svg`
  ${layerStyles()};
  /* border: 1px solid green; */
  width: 2px;
  height: 2px;
`;

function getScaleStyle(z: Zoom) {
  const { scale, offsetX, offsetY } = z;
  return {
    // width: `calc(${inv}% + ${offsetX}px)`, // not necessary with overflow: visible
    // height: `calc(${inv}% + ${offsetY}px)`,
    transform: `translate(${offsetX}px,${offsetY}px) scale(${scale})`,
  };
}

interface State {
  zoomTransform?: ZoomTransform;
}
const filteredEvents = new Set([
  'mousedown',
  'wheel',
  'dblclick',
  'touchstart',
  'touchend',
  'touchmove',
]);
class CanvasVanilla extends React.Component<Props, State> {
  public state: State = {
    zoomTransform: undefined,
  };
  private container = React.createRef<HTMLDivElement>();
  private mainContainer = React.createRef<HTMLDivElement>();
  private svgLayer = React.createRef<SVGElement>();
  private readonly zoom: ZoomBehavior<HTMLDivElement, {}>;
  private zoomTransform = zoomIdentity;

  constructor(props: Readonly<Props>) {
    super(props);
    this.zoom = d3Zoom<HTMLDivElement, {}>()
      .scaleExtent([0.1, 5])
      .filter(() => {
        const event = require('d3-selection').event;
        if (
          filteredEvents.has(event.type) &&
          this.container.current &&
          this.mainContainer.current
        ) {
          if (
            event.target !== this.container.current &&
            event.target !== this.mainContainer.current
          ) {
            return false;
          }
        }
        return !event.button;
      })
      .on('zoom', this.zoomed.bind(this as any));
  }
  attachZoom() {
    if (this.container.current) {
      // Error appeared with updated typings
      select(this.container.current).call(this.zoom as any);
    }
  }
  deAttachZoom() {
    // console.log('deAttachZoom');
    if (this.container.current) {
      select(this.container.current).on('.zoom', null);
    }
  }

  get store() {
    return this.props.store!;
  }
  componentDidMount() {
    const container = this.container.current;
    if (container) {
      // TO PREVENT SCROLLING ON MOBILE
      container.ontouchmove = () => false;
      this.store.setCanvasDimensions(
        container.clientWidth,
        container.clientHeight
      );
      document.addEventListener('keyup', this.onKeyPressHandler);
    }
    this.attachZoom();
  }
  componentDidUpdate(_prevProps: Props, _prevState: State) {
    if (!this.zoomTransform || !this.container.current) {
      return;
    }
    const { k, x, y } = this.zoomTransform;
    const { scale, offsetX, offsetY } = this.store.zoom;
    // This happens if we update the zoom on the store from outside
    // the zoom event handler
    if (scale !== k || offsetX !== x || offsetY !== y) {
      // Error appeared with updated typings
      this.zoom.transform(
        select(this.container.current) as any,
        zoomIdentity.translate(offsetX, offsetY).scale(scale)
      );
    }
  }

  zoomed: ValueFn<HTMLDivElement, any, void> = () => {
    // console.log('zoomed');
    const event = require('d3-selection').event;
    this.zoomTransform = event.transform;
    // NOTE: could be asynchronous and not in sync with this.zoomTransform
    this.store.setZoom(zoomTransformToZoom(event.transform));
  };

  handleClick: React.MouseEventHandler = e => {
    const { clearSelection, createBox, zoom, tool, editing } = this.store;
    const { scale, offsetX, offsetY } = zoom;
    // only handle clicks that actually originate from the canvas
    if (!this.isCanvasClick(e)) {
      return;
    }
    if (tool === TOOL_ADD_NODE && !editing) {
      createBox!(
        undefined,
        (e.clientX - offsetX - INITIAL_WIDTH / 2) / scale,
        (e.clientY - offsetY - INITIAL_HEIGHT / 2) / scale
      );
    }
    if (tool === TOOL_NONE) {
      clearSelection();
    }
  };

  isCanvasClick = (e: React.SyntheticEvent<any>) => {
    return (
      e.target === this.container.current ||
      e.target === this.mainContainer.current
    );
  };

  onKeyPressHandler = ({ target, key }: KeyboardEvent) => {
    const t = target as any;
    if (t && t.nodeName === 'INPUT') {
      return;
    }
    const { selection, removeElement } = this.props.store!;
    if (selection && key === 'Backspace') {
      removeElement(selection);
    }
  };

  public render() {
    const { boxes, arrows, zoom, connecting, tool } = this.store;
    // const zoom = zoomTransformToZoom(this.state.zoomTransform || { x: 0, y: 0, k: 1 });
    // const { scale, offsetX, offsetY } = zoom;
    return (
      <OuterContainer
        innerRef={this.container}
        onClick={this.handleClick}
        tool={tool}
      >
        <MainContainer
          style={getScaleStyle(zoom)}
          innerRef={this.mainContainer}
          tool={tool}
        >
          <SvgLayer innerRef={this.svgLayer}>
            <defs>
              <MarkerArrowDef />
              <MarkerSelectedArrowDef />
            </defs>
            {arrows
              .filter(a => isVisible(a.from) && isVisible(a.to))
              .map(arrow => (
                <ArrowView arrow={arrow} key={arrow.id} />
              ))}
            {connecting && <ConnectingArrowView arrow={connecting} />}
            {/* {connecting && arrowCandidate && <ArrowView arrow={arrowCandidate}/>} */}
          </SvgLayer>
          {values(boxes)
            .filter(box => isVisible(box))
            .map(box => (
              <BoxView box={box} key={box.id} zoom={zoom} />
            ))}
        </MainContainer>
      </OuterContainer>
    );
  }
}

function isVisible({ context }: IBox) {
  return !context || (context && context.visible);
}

export const Canvas = connect<Props>((store, _props) => ({
  store,
  tool: store.tool,
  editing: store.editing,
}))(observer(CanvasVanilla));
