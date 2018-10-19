import React from 'react';
import { InputGroup } from '@blueprintjs/core';
import {
  POSITION_BOTTOM,
  POSITION_LEFT,
  POSITION_RIGHT,
  POSITION_TOP,
  TOOL_ADD_NODE,
  TOOL_CONNECT,
  TOOL_NONE,
  TOOL_REMOVE_NODE,
  TOOL_LAYERS,
} from './constants';

import styled, { OuterStyledProps } from 'styled-components';
import { IContext } from '../models';
import IconCursor from './icon-cursor';
import IconFit from './icon-fit';
import IconLayers from './icon-layers';
import IconPlus from './icon-plus';
import IconConnect from './icon-plus-arrow';
import IconRemove from './icon-remove';
import IconSignout from './icon-signout';
import ToolbarButton from './toolbar-button';
import { ToolbarDivider } from './toolbar-divider';

const ContextInputContainer = styled.div`
  position: absolute;
  bottom: -2px;
  left: 0px;
  right: 0px;
  transform: translate(0%, 100%);
`;

interface Props {
  tool: string;
  onFit: () => void;
  onChangeTool: (tool: string) => void;
  position: string;
  showContextInput: boolean;
  setContextInputValue: (v: string) => void;
  contextInputValue: string;
  addContext: (name: string) => IContext | undefined;
  onSignOut?: () => void;
  signedIn?: boolean;
}

export const Toolbar: React.SFC<Props> = ({
  tool,
  onFit,
  onChangeTool,
  position,
  onSignOut,
  signedIn,
  showContextInput,
  setContextInputValue,
  contextInputValue,
  addContext,
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

  const handleSignout = (event: any) => {
    if (onSignOut) {
      onSignOut();
    }
    event.stopPropagation();
    event.preventDefault();
  };

  const contextKeyUpHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      addContext(contextInputValue);
    }
    if (e.key === 'Escape') {
      e.currentTarget.value = '';
      // toggleContextInput();
    }
  };

  const contextChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setContextInputValue(e.currentTarget.value);
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
        active={tool === TOOL_ADD_NODE}
        name="add-node"
        title="Add node"
        onClick={handleChangeTool(TOOL_ADD_NODE)}
      >
        <IconPlus />
      </ToolbarButton>
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_REMOVE_NODE}
        name="remove-node"
        title="Remove node"
        onClick={handleChangeTool(TOOL_REMOVE_NODE)}
      >
        <IconRemove />
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
      <ToolbarButton
        toolbarPosition={position}
        active={tool === TOOL_LAYERS}
        name="select-tool-layers"
        title="Add group"
        onClick={handleChangeTool(TOOL_LAYERS)}
      >
        <IconLayers />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        toolbarPosition={position}
        active={false}
        name="fit-to-viewer"
        title="Fit to viewer"
        onClick={handleFit}
      >
        <IconFit />
      </ToolbarButton>
      <ToolbarDivider />

      <ToolbarButton
        toolbarPosition={position}
        active={false}
        disabled={!signedIn}
        name="logout"
        title="Logout"
        onClick={handleSignout}
      >
        <IconSignout />
      </ToolbarButton>
      {showContextInput ? (
        <ContextInputContainer>
          <InputGroup
            value={contextInputValue}
            onChange={contextChangeHandler}
            onKeyUp={contextKeyUpHandler}
          />
        </ContextInputContainer>
      ) : null}
    </div>
  );
};
