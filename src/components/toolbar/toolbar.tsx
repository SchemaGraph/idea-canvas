import React from 'react';
import {
  POSITION_BOTTOM,
  POSITION_LEFT,
  POSITION_RIGHT,
  POSITION_TOP,
  TOOL_CONNECT,
  TOOL_NONE,
  TOOL_PAN,
} from './constants';


import IconCursor from './icon-cursor';
import IconFit from './icon-fit';
import IconPan from './icon-pan';
import IconPlus from './icon-plus';
import IconConnect from './icon-plus-arrow';
import IconRemove from './icon-remove';
import ToolbarButton from './toolbar-button';
import { ToolbarDivider } from './toolbar-divider';

interface Props {
  tool: string;
  onFit: () => void;
  onChangeTool: (tool: string) => void;
  onAddNode: () => void;
  onRemoveNode: () => void;
  selectedNode: any;
  position: string;
  onSignOut?: () => void;
}

export const Toolbar: React.SFC<Props> = ({
  tool,
  onFit,
  onChangeTool,
  onAddNode,
  onRemoveNode,
  selectedNode,
  position,
  onSignOut,
}) => {
  const handleChangeTool = (newTool: string) => (event: any) => {
    onChangeTool(newTool);
    event.stopPropagation();
    event.preventDefault();
  };

  const handleFit = (event: any) => {
    onFit();
    event.stopPropagation();
    event.preventDefault();
  };

  const handleAddNode = (event: any) => {
    onAddNode();
    event.stopPropagation();
    event.preventDefault();
  };

  const handleRemoveNode = (event: any) => {
    onRemoveNode();
    event.stopPropagation();
    event.preventDefault();
  };

  const handleSignout = (event: any) => {
    if (onSignOut) {
      onSignOut();
    }
    event.stopPropagation();
    event.preventDefault();
  };


  const isHorizontal = [POSITION_TOP, POSITION_BOTTOM].indexOf(position) >= 0;

  const style: React.CSSProperties = {
    // position
    position: 'absolute',
    transform:
      [POSITION_TOP, POSITION_BOTTOM].indexOf(position) >= 0
        ? 'translate(-50%, 0px)'
        : 'none',
    top:
      [POSITION_LEFT, POSITION_RIGHT, POSITION_TOP].indexOf(position) >= 0
        ? '5px'
        : 'unset',
    left:
      [POSITION_TOP, POSITION_BOTTOM].indexOf(position) >= 0
        ? '50%'
        : POSITION_LEFT === position
          ? '5px'
          : 'unset',
    right: [POSITION_RIGHT].indexOf(position) >= 0 ? '5px' : 'unset',
    bottom: [POSITION_BOTTOM].indexOf(position) >= 0 ? '5px' : 'unset',
    zIndex: 10,

    // inner styling
    backgroundColor: 'rgba(19, 20, 22, 0.90)',
    borderRadius: '2px',
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    padding: isHorizontal ? '1px 2px' : '2px 1px',
  };

  return (
    <div style={style} role="toolbar">
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_NONE}
        name="unselect-tools"
        title="Selection"
        onClick={handleChangeTool(TOOL_NONE)}
      >
        <IconCursor />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_PAN}
        name="select-tool-pan"
        title="Pan"
        onClick={handleChangeTool(TOOL_PAN)}
      >
        <IconPan />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_CONNECT}
        name="select-tool-connect"
        title="Connect"
        onClick={handleChangeTool(TOOL_CONNECT)}
      >
        <IconConnect />
      </ToolbarButton>


      <ToolbarDivider/>

      <ToolbarButton
        toolbarPosition={position}
        active={false}
        name="add-node"
        title="Add node"
        onClick={handleAddNode}
      >
        <IconPlus />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={position}
        active={false}
        name="remove-node"
        title="Remove node"
        onClick={handleRemoveNode}
        disabled={!selectedNode}
      >
        <IconRemove />
      </ToolbarButton>
      <ToolbarDivider/>

      {/* <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_ZOOM_IN}
        name="select-tool-zoom-in"
        title="Zoom in"
        onClick={ event => handleChangeTool(event, TOOL_ZOOM_IN) }>
        <IconZoomIn/>
      </ToolbarButton>

      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_ZOOM_OUT}
        name="select-tool-zoom-out"
        title="Zoom out"
        onClick={ event => handleChangeTool(event, TOOL_ZOOM_OUT) }>
        <IconZoomOut/>
      </ToolbarButton>
 */}
      <ToolbarButton
        toolbarPosition={position}
        active={false}
        name="fit-to-viewer"
        title="Fit to viewer"
        onClick={handleFit}
      >
        <IconFit />
      </ToolbarButton>

      <ToolbarButton
        toolbarPosition={position}
        active={false}
        name="logout"
        title="Logout"
        onClick={handleSignout}
      >
        <IconRemove />
      </ToolbarButton>

    </div>
  );
};
