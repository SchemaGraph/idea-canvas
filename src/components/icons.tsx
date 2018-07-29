import { rgb } from 'd3-color';
import styled from 'styled-components';
import { Info } from 'styled-icons/fa-solid/Info';
import { Close } from 'styled-icons/material/Close';

interface InfoIconProps {
  active?: boolean;
}
function monochrome(c: number) {
  const value = Math.round(255 * Math.min(1, Math.max(0, c)));
  return rgb(value, value, value);
}

export const InfoIcon = styled(Info).attrs({
  size: 24,
})`
  color: ${({ active }: InfoIconProps) =>
    active ? monochrome(0.3).toString() : monochrome(0.85).toString()};
  cursor: pointer;
  &:hover {
    color: ${monochrome(0.95).toString()};
  }
`;

export const CloseIcon = styled(Close).attrs({
  size: 24,
})`
  color: ${({ active }: InfoIconProps) =>
    active ? monochrome(0.1).toString() : monochrome(0.3).toString()};

  cursor: pointer;
  &:hover {
    color: ${monochrome(0.1).toString()};
  }
`;
