import * as React from 'react';
// import { POSITION_BOTTOM, POSITION_TOP } from './constants';

interface Props {
  width?: number;
}
export const ToolbarDivider: React.SFC<Props> = props => {
  const { width = 12 } = props;
  const style = {
    display: 'block',
    width: `${width}px`,
    height: '24px',
    background: 'none',
    padding: '0px',
    border: '0px',
    outline: '0px',
  };

  return <div style={style}>{props.children}</div>;
};
