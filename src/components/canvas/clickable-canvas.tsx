import React, { FunctionComponent, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import 'd3-transition';

import { IStore } from '../../models/store';
import { connect } from '../../utils';
import { TOOL_ADD_NODE, TOOL_NONE, TOOL_FILTER } from '../toolbar/constants';
import { ZoomCanvas } from './zoom-canvas';
import { INITIAL_WIDTH, INITIAL_HEIGHT } from '../../models/models';

interface Props {
  store?: IStore;
}
type FinalProps = Props & React.HTMLAttributes<HTMLDivElement>;

const ClickableCanvasBase: FunctionComponent<FinalProps> = ({
  store,
  children,
  ...rest
}) => {
  if (!store) {
    return null;
  }

  const clickHandler = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    e => {
      const {
        clearSelection,
        createBox,
        getZoomTransform,
        tool,
        editing,
      } = store;
      const { k: scale, x: offsetX, y: offsetY } = getZoomTransform();
      if (tool === TOOL_ADD_NODE && !editing) {
        createBox!(
          (e.clientX - offsetX - INITIAL_WIDTH / 2) / scale,
          (e.clientY - offsetY - INITIAL_HEIGHT / 2) / scale
        );
      }
      if (tool === TOOL_NONE || tool === TOOL_FILTER) {
        clearSelection();
      }
    },
    []
  );

  return (
    <ZoomCanvas onCanvasClick={clickHandler} {...rest}>
      {children}
    </ZoomCanvas>
  );
};

export const ClickableZoomableCanvas = connect<FinalProps>((store, _props) => ({
  store,
}))(observer(ClickableCanvasBase));
