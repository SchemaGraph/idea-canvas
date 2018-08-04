import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';

import { IStore } from '../../store';
import { connect } from '../../utils';
import {
  ALIGN_BOTTOM,
  ALIGN_CENTER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  ALIGN_TOP,
  POSITION_BOTTOM,
  POSITION_LEFT,
  POSITION_RIGHT,
  POSITION_TOP,
  TOOL_NONE,
  TOOL_PAN,
  TOOL_ZOOM_IN,
  TOOL_ZOOM_OUT,
} from './constants';
import TToolbar from './toolbar';

interface Props {
  store?: IStore;
}

const ToolbarVanilla: React.SFC<Props> = ({ store }) => {
  const { tool, setTool, setZoom, createBox, removeElement, selection } = store!;
  const onFit = () => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
  };
  const onAddNode = () => {
    createBox('');
  };
  const onRemoveNode = () => {
    if (selection) {
      removeElement(selection.id);
    }
  };

  return (
    <TToolbar
      tool={tool}
      onChangeTool={setTool}
      onFit={onFit}
      onAddNode={onAddNode}
      onRemoveNode={onRemoveNode}
      selectedNode={selection && selection.id}
      position={POSITION_TOP}
      SVGAlignX={ALIGN_CENTER}
      SVGAlignY={ALIGN_CENTER}
    />
  );
};

export const Toolbar = connect<Props>((store, _props) => ({
  store,
}))(observer(ToolbarVanilla));
