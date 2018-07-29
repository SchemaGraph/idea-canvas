import { values } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import styled from 'styled-components';

import { IStore, Zoom } from '../store';
import { connect } from '../utils';
import { ArrowView } from './arrow-view';
import { BoxView } from './box-view';

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

const MainContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  border: 2px solid red;
`;

const LinkLayer = styled.svg`
  ${layerStyles()};
`;

const NodeLayer = styled.div`
  ${layerStyles()};
  border: 1px solid blue;
`;

function getScaleStyle(z: Zoom) {
  const { scale, offsetX, offsetY } = z;
  const inv = (100 / scale).toFixed(4);
  return {
    width: `${inv}%`,
    height: `${inv}%`,
    transform: `translate(${offsetX}px,${offsetY}px) scale(${scale})`,
  };
}

const CanvasVanilla: React.SFC<Props> = ({ store }) => {
  const {
    clearSelection,
    createBox,
    boxes,
    arrows,
    zoom,
    setZoom,
    setDragging,
  } = store!;
  const { scale, offsetX, offsetY } = zoom;
  const handleClick: React.MouseEventHandler = e => {
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

  const start: DraggableEventHandler = e => {
    const { target } = e;
    // console.log('DRAG-CANVAS', e.currentTarget, e.target);
    const t = target as any;
    // console.log(t.className);
    if (t && t.className && t.className.indexOf('NodeLayer') > -1) {
      return setDragging('CANVAS');
    }
    console.log('CANCELED');
    return false;
  };
  const stop = () => setDragging(null);
  const move: DraggableEventHandler = (_, { deltaX, deltaY }) =>
    setZoom({ scale, offsetX: offsetX + deltaX, offsetY: offsetY + deltaY });

  return (
    <DraggableCore onDrag={move} onStart={start} onStop={stop} disabled={false}>
      <MainContainer onWheel={handleWheel(zoom, setZoom)}>
        <LinkLayer style={getScaleStyle(zoom)}>
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
            </marker>
          </defs>
          {arrows.map(arrow => <ArrowView arrow={arrow} key={arrow.id} />)}
        </LinkLayer>
        <NodeLayer
          style={getScaleStyle({ scale, offsetX: 0, offsetY: 0 })}
          onClick={handleClick}
        >
          {values(boxes).map(box => (
            <BoxView box={box} key={box.id} zoom={zoom} />
          ))}
        </NodeLayer>
      </MainContainer>
    </DraggableCore>
  );
};

export const Canvas = connect<Props>((store, _props) => ({
  store,
}))(observer(CanvasVanilla));

function handleWheel(
  currentZoom: Zoom,
  setZoom: (z: Zoom) => void
): React.WheelEventHandler<HTMLDivElement> {
  return event => {
    event.preventDefault();
    event.stopPropagation();
    let scrollDelta = event.deltaY;
    // check if it is pinch gesture
    if (event.ctrlKey && scrollDelta % 1 !== 0) {
      /*Chrome and Firefox sends wheel event with deltaY that
          have fractional part, also `ctrlKey` prop of the event is true
          though ctrl isn't pressed
        */
      scrollDelta /= 3;
    } else {
      scrollDelta /= 60;
    }
    const scaleDelta = scrollDelta / 100;
    const newScale = currentZoom.scale + scaleDelta;
    if (newScale < 0.1) {
      return;
    }
    return setZoom({
      scale: newScale,
      offsetX: currentZoom.offsetX,
      offsetY: currentZoom.offsetY,
    });
  };
}
