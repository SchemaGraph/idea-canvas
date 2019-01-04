import React from 'react';

import { SimulationCanvas } from './simulation-canvas';
import { ClickableZoomableCanvas } from './clickable-canvas';

export const Canvas = () => {
  return (
    <ClickableZoomableCanvas>
      <SimulationCanvas />
    </ClickableZoomableCanvas>
  );
};
