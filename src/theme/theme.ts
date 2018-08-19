import Color from 'color';
import { css, keyframes } from 'styled-components';

export const fadedAlpha = 0.95;

export const colors = {
  orange: Color('#f99b1d'),
  blue: Color('#2d3e4e'),
  white: Color('#ffffff'),
};

export const rippleAnimation = keyframes`
  0% {
    transform: scale(0, 0);
    opacity: 1;
  }
  20% {
    transform: scale(25, 25);
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}
`;

export const rippleStyles = css`
  /* Ripple magic */
  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
  }
`;
