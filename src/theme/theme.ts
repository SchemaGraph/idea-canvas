import Color from 'color';
import { schemeCategory10 } from 'd3-scale-chromatic';
import styled, { css, keyframes } from 'styled-components';

export const fadedAlpha = 0.95;

export const colors = {
  orange: Color('#f99b1d'),
  blue: Color('#2d3e4e'),
  white: Color('#ffffff'),
};

export const defaultContextColor = (i: number) => {
  if (i < 0 || i > 9) {
    throw new Error('Ran out of colors');
  }
  const color = Color(schemeCategory10[i]);
  return color;
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

const workSansPath = 'https://fonts.gstatic.com/s/worksans/v2';
const zillaSlabPath = 'https://fonts.gstatic.com/s/zillaslab/v3';

export const global = css`
@font-face {
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 400;
  src:
    local('Work Sans'),
    local('WorkSans-Regular'),
    url("${workSansPath}/ElUAY9q6T0Ayx4zWzW63VJBw1xU1rKptJj_0jans920.woff2") format('woff2');
}
@font-face {
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 600;
  src:
    local('Work Sans SemiBold'),
    local('WorkSans-SemiBold'),
    url("${workSansPath}/z9rX03Xuz9ZNHTMg1_ghGRampu5_7CjHW5spxoeN3Vs.woff2") format('woff2');
}
@font-face {
  font-family: 'Zilla Slab';
  font-style: normal;
  font-weight: 400;
  src:
    local('Zilla Slab Regular'),
    local('ZillaSlab-Regular'),
    url("${zillaSlabPath}/dFa6ZfeM_74wlPZtksIFajo6_V6LVlA.woff2") format('woff2');
}
@font-face {
  font-family: 'Zilla Slab';
  font-style: normal;
  font-weight: 600;
  src:
    local('Zilla Slab SemiBold'),
    local('ZillaSlab-SemiBold'),
    url("${zillaSlabPath}/dFa5ZfeM_74wlPZtksIFYuUe6HOpW3pwfa0.woff2") format('woff2');
}

body {
  padding: 0;
  margin: 0;
  overflow: hidden;
  touch-action: manipulation;
  /* -webkit-overflow-scrolling: touch; */
  color: rgba(255, 255, 255, 0.8);
  background-color: ${colors.blue.rgb().string()} !important;
  font-family: 'Work Sans', Arial, sans-serif !important;
}
h1,h2,h3,h4,h5,h6 {
  font-family: 'Zilla Slab', 'Work Sans', Arial, sans-serif !important;
}

`;

export const Root = styled.div`
  height: 100%;
  /* display: flex; */
  position: relative;
  overflow: hidden;
`;



export const theme = {
  input: css
};
