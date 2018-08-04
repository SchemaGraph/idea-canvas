import React from 'react';
import PropTypes from 'prop-types';
import {
  TOOL_NONE,
  TOOL_PAN,
  TOOL_ZOOM_IN,
  TOOL_ZOOM_OUT,
  POSITION_TOP,
  POSITION_RIGHT,
  POSITION_BOTTOM,
  POSITION_LEFT,
  ALIGN_CENTER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  ALIGN_TOP,
  ALIGN_BOTTOM,
  TOOL_ADD_NODE,
  TOOL_CONNECT,
} from './constants';

import IconPlus from './icon-plus';
import IconCursor from './icon-cursor';
import IconPan from './icon-pan';
import IconZoomIn from './icon-zoom-in';
import IconZoomOut from './icon-zoom-out';
import IconFit from './icon-fit';
import ToolbarButton from './toolbar-button';
import { ToolbarDivider } from './toolbar-divider';
import IconRemove from './icon-remove';
import IconConnect from './icon-plus-arrow';

export default function Toolbar({
  tool,
  onFit,
  onChangeTool,
  onAddNode,
  onRemoveNode,
  selectedNode,
  position,
  SVGAlignX,
  SVGAlignY,
}) {
  let handleChangeTool = (event, tool) => {
    onChangeTool(tool);
    event.stopPropagation();
    event.preventDefault();
  };

  let handleFit = event => {
    onFit();
    event.stopPropagation();
    event.preventDefault();
  };

  let handleAddNode = event => {
    onAddNode();
    event.stopPropagation();
    event.preventDefault();
  };

  let handleRemoveNode = event => {
    onRemoveNode();
    event.stopPropagation();
    event.preventDefault();
  };

  let isHorizontal = [POSITION_TOP, POSITION_BOTTOM].indexOf(position) >= 0;

  let style = {
    //position
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

    //inner styling
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
        onClick={event => handleChangeTool(event, TOOL_NONE)}
      >
        <IconCursor />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_PAN}
        name="select-tool-pan"
        title="Pan"
        onClick={event => handleChangeTool(event, TOOL_PAN)}
      >
        <IconPan />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_CONNECT}
        name="select-tool-connect"
        title="Connect"
        onClick={event => handleChangeTool(event, TOOL_CONNECT)}
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
        onClick={event => handleFit(event)}
      >
        <IconFit />
      </ToolbarButton>
    </div>
  );
}

Toolbar.propTypes = {
  position: PropTypes.oneOf([
    POSITION_TOP,
    POSITION_RIGHT,
    POSITION_BOTTOM,
    POSITION_LEFT,
  ]).isRequired,
  tool: PropTypes.string.isRequired,
  onFit: PropTypes.func.isRequired,
  onAddNode: PropTypes.func.isRequired,
  onRemoveNode: PropTypes.func.isRequired,
  onChangeTool: PropTypes.func.isRequired,
  selectedNode: PropTypes.string,
  SVGAlignX: PropTypes.oneOf([ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT]),
  SVGAlignY: PropTypes.oneOf([ALIGN_CENTER, ALIGN_TOP, ALIGN_BOTTOM]),
};

Toolbar.defaultProps = {
  SVGAlignX: ALIGN_LEFT,
  SVGAlignY: ALIGN_TOP,
};
