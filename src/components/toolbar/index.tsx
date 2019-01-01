import { observer } from 'mobx-react';
import * as React from 'react';

import { IStore } from '../../models/store';
import { connect } from '../../utils';
import { POSITION_TOP } from './constants';
import { Toolbar as TToolbar } from './toolbar';

interface Props {
  onSignOut?: () => void;
  signedIn?: boolean;
  store?: IStore;
}

const ToolbarVanilla: React.SFC<Props> = ({ store, onSignOut, signedIn }) => {
  const {
    tool,
    setTool,
    setZoom,
  } = store!;
  const onFit = () => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
  };

  return (
    <TToolbar
      tool={tool}
      onChangeTool={setTool}
      onFit={onFit}
      position={POSITION_TOP}
      onSignOut={onSignOut}
      signedIn={signedIn}
    />
  );
};

export const Toolbar = connect<Props>((store, _props) => ({
  store,
}))(observer(ToolbarVanilla));
