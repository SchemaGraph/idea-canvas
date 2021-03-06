import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { IUndoManager } from '../models/undo-manager';
import { POSITION_TOP } from './toolbar/constants';
import IconBack from './toolbar/icon-back';
import IconForward from './toolbar/icon-forward';
import ToolbarButton from './toolbar/toolbar-button';

const Toolbar = styled.div`
  position: absolute;
  left: 5px;
  top: 5px;
  background-color: rgba(19, 20, 22, 0.9);
  border-radius: 2px;
  display: flex;
  flex-direction: row;
  padding: 1px 2px;
`;
interface Props {
  manager: IUndoManager;
}
export const UndoRedoVanilla: React.SFC<Props> = ({ manager }) => {
  const { undo, redo, canUndo, canRedo } = manager;
  const undoo = () => canUndo && undo();
  const redoo = () => canRedo && redo();

  return (
    <Toolbar role="toolbar">
      <ToolbarButton
        toolbarPosition={POSITION_TOP}
        active={false}
        name="undo"
        title="Undo"
        onClick={undoo}
        disabled={!canUndo}
      >
        <IconBack />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={POSITION_TOP}
        active={false}
        name="redo"
        title="Redo"
        onClick={redoo}
        disabled={!canRedo}
      >
        <IconForward />
      </ToolbarButton>
    </Toolbar>
  );
};

export const UndoRedo = observer(UndoRedoVanilla);
