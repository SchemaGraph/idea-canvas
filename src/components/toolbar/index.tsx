import { observer } from 'mobx-react';
import * as React from 'react';

import { IStore } from '../../store';
import { connect } from '../../utils';
import {
  ALIGN_CENTER,
  POSITION_TOP,
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
