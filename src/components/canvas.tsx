import { select, ValueFn } from 'd3-selection';
import { zoom as d3Zoom, ZoomBehavior, ZoomTransform } from 'd3-zoom';
import { values } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';

import { IStore, Zoom } from '../store';
import { colors } from '../theme/theme';
import { connect } from '../utils';
import { ArrowView } from './arrow-view';
import { BoxView } from './box-view';
import { TOOL_PAN } from './toolbar/constants';

function zoomTransformToZoom(zt: { x: number; y: number; k: number }): Zoom {
  return {
    scale: zt.k,
    offsetX: zt.x,
    offsetY: zt.y,
  };
}
interface Props {
  store?: IStore;
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

const DevInfo = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.9);
  font-size: 18px;
`;

const OuterContainer = styled.div`
  ${layerStyles()};
  border: 0px solid red;
`;

const MainContainer = styled.div`
  ${layerStyles()};
  border: 0px solid blue;
`;

const SvgLayer = styled.svg`
  ${layerStyles()};
`;

const HtmlLayer = styled.div`
  ${layerStyles()};
  border: 0px solid blue;
`;

function getScaleStyle(z: Zoom) {
  const { scale, offsetX, offsetY } = z;
  const inv = (100 / scale).toFixed(4);
  return {
    width: `calc(${inv}% + ${offsetX}px)`,
    height: `calc(${inv}% + ${offsetY}px)`,
    transform: `translate(${offsetX}px,${offsetY}px) scale(${scale})`,
  };
}

interface State {
  zoomTransform?: ZoomTransform;
}

class CanvasVanilla extends React.Component<Props, State> {
  public state: State = {
    zoomTransform: undefined,
  };
  private container = React.createRef<HTMLDivElement>();
  private mainContainer = React.createRef<HTMLDivElement>();
  private svgLayer = React.createRef<SVGElement>();
  private readonly zoom: ZoomBehavior<HTMLDivElement, {}>;
  private zoomTransform?: ZoomTransform;

  constructor(props: Readonly<Props>) {
    super(props);
    this.zoom = d3Zoom<HTMLDivElement, {}>()
      .scaleExtent([0.1, 5])
      .on('zoom', this.zoomed.bind(this));
  }
  attachZoom() {
    if (this.container.current) {
      select(this.container.current).call(this.zoom);
    }
  }
  deAttachZoom() {
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
      // this.container.current.addEventListener(
      //   'ontouchmove',
      //   e => {
      //     e.preventDefault();
      //     e.stopPropagation();
      //     e.stopImmediatePropagation();
      //   },
      //   { passive: false }
      // );
      document.addEventListener('keyup', this.onKeyPressHandler);
    }

    const { tool } = this.store;
    if (tool === TOOL_PAN) {
      this.attachZoom();
    } else {
      this.deAttachZoom();
    }
  }
  componentDidUpdate(_prevProps: Props, _prevState: State) {
    const { tool } = this.store;
    if (tool === TOOL_PAN) {
      this.attachZoom();
    } else {
      this.deAttachZoom();
    }
    const zoomTransform = this.zoomTransform;
    const { zoom } = this.store;
    if (!zoomTransform || !this.container.current) {
      return;
    }
    const { k, x, y } = zoomTransform;
    const { scale, offsetX, offsetY } = zoom;
    if (scale !== k || offsetX !== x || offsetY !== y) {
      // This happens if we update the zoom on the store from outside
      // the zoom event handler
      const selection = select(this.container.current);
      const t = zoomTransform
        .translate(offsetX - x / k, offsetY - y / k)
        .scale(scale / k);
      this.zoom.transform(selection, t);
    }
  }

  zoomed: ValueFn<HTMLDivElement, any, void> = () => {
    const event = require('d3-selection').event;
    this.zoomTransform = event.transform;
    // NOTE: could be asynchronous and not in sync with this.zoomTransform
    this.store.setZoom(zoomTransformToZoom(event.transform));
  };

  handleClick: React.MouseEventHandler = e => {
    const { clearSelection, createBox, zoom } = this.store;
    const { scale, offsetX, offsetY } = zoom;
    // console.log(e.target);
    // only handle clicks that actually originate from the canvas
    if (
      !e.target ||
      !this.mainContainer.current ||
      !this.container.current ||
      !(
        e.target === this.container.current ||
        e.target === this.mainContainer.current
      )
    ) {
      return;
    }
    if (e.ctrlKey === false && e.altKey === false) {
      clearSelection();
    } else {
      createBox!(
        '',
        (e.clientX - offsetX) / scale,
        (e.clientY - offsetY) / scale
      );
    }
  };

  onKeyPressHandler = ({ target, key }: KeyboardEvent) => {
    const t = target as any;
    if (t && t.nodeName === 'INPUT') {
      return;
    }
    const { selection, removeElement } = this.props.store!;
    if (selection && key === 'Backspace') {
      removeElement(selection.id);
    }
  };

  public render() {
    const { boxes, arrows, zoom, tool } = this.store;
    // const zoom = zoomTransformToZoom(this.state.zoomTransform || { x: 0, y: 0, k: 1 });
    // const { scale, offsetX, offsetY } = zoom;
    return (
      <OuterContainer innerRef={this.container} onClick={this.handleClick}>
        <MainContainer
          style={getScaleStyle(zoom)}
          innerRef={this.mainContainer}
        >
          {/* <DevInfo>
          scale: {scale.toFixed(2)}, x: {offsetX.toFixed(0)}, y:{' '}
          {offsetY.toFixed(0)}
        </DevInfo> */}
          {/* <HtmlLayer
          style={getScaleStyle({ scale, offsetX: 0, offsetY: 0 })}
          innerRef={this.nodeLayer}
          onClick={this.handleClick}
        >
        </HtmlLayer> */}
          <SvgLayer innerRef={this.svgLayer}>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill={colors.white.toString()}
                />
              </marker>
              <marker
                id="arrow-selected"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill={colors.orange.toString()}
                />
              </marker>
            </defs>
            {arrows.map(arrow => <ArrowView arrow={arrow} key={arrow.id} />)}
          </SvgLayer>
          {values(boxes).map(box => (
            <BoxView box={box} key={box.id} zoom={zoom} />
          ))}
        </MainContainer>
      </OuterContainer>
    );
  }
}

export const Canvas = connect<Props>((store, _props) => ({
  store,
}))(observer(CanvasVanilla));
