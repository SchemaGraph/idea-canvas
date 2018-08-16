import React from 'react';
import { POSITION_BOTTOM, POSITION_TOP } from './constants';

interface Props {
  disabled?: boolean;
  title: string;
  name: string;
  toolbarPosition: string;
  onClick: React.MouseEventHandler;
  active: boolean;
}
export default class ToolbarButton extends React.Component<Props> {

  state = { hover: false };

  change = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    switch (event.type) {
      case 'mouseenter':
      case 'touchstart':
        this.setState({ hover: !this.props.disabled });
        break;
      case 'mouseleave':
      case 'touchend':
      case 'touchcancel':
        this.setState({ hover: false });
        break;
    }
  }

  render() {
    const style: React.CSSProperties = {
      display: 'block',
      width: '24px',
      height: '24px',
      margin:
        [POSITION_TOP, POSITION_BOTTOM].indexOf(this.props.toolbarPosition) >= 0
          ? '2px 1px'
          : '1px 2px',
      color: this.props.active || this.state.hover ? '#1CA6FC' : '#FFF',
      opacity: this.props.disabled ? 0.3 : 1,
      transition: 'color 200ms ease',
      background: 'none',
      padding: '0px',
      border: '0px',
      outline: '0px',
      cursor: this.props.disabled ? 'auto' : 'pointer',
    };

    const touchHandler = (e:any) => {
      this.change(e);
      if (this.props.disabled) {
        return;
      }
      this.props.onClick(e);
    };

    return (
      <button
        onMouseEnter={this.change}
        onMouseLeave={this.change}
        onTouchStart={touchHandler}
        onTouchEnd={this.change}
        onTouchCancel={this.change}
        onClick={touchHandler}
        style={style}
        title={this.props.title}
        name={this.props.name}
        role="button"
        type="button"
      >
        {this.props.children}
      </button>
    );
  }
}
