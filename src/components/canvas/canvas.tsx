import React, { FunctionComponent } from 'react';

import { SimulationCanvas } from './simulation-canvas';
import { ClickableZoomableCanvas } from './clickable-canvas';
import { FocusCanvas } from './focus-canvas';
import { connect } from '../../utils';
import { observer } from 'mobx-react-lite';

interface Props {
  focus?: string | null;
}
const CanvasBase: FunctionComponent<Props> = ({ focus }) => {
  return (
    <ClickableZoomableCanvas>
      {focus ? <FocusCanvas /> : <SimulationCanvas />}
    </ClickableZoomableCanvas>
  );
};

export const Canvas = connect<Props>((store, _props) => ({
  focus: store.focus,
}))(observer(CanvasBase));
