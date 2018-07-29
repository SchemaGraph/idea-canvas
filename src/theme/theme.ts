import { rgb, RGBColor } from 'd3-color';

export const meBlue = rgb(18, 65, 145);
export const meOrange = rgb(255, 149, 0);

export function opacity(color: RGBColor, op: number) {
  const copy = rgb(color);
  copy.opacity = op;
  return copy;
}

const px = (v: number) => `${v}px`;
function chooser(map: number[], formatter = px) {
  return (n?: number, raw = false) => {
    let v = n;
    if (!v) {
      v = map[0];
    } else {
      const rounded = Math.round(v);
      if (rounded === n && n >= 0 && n < map.length) {
        v = map[n];
      }
    }
    return raw ? v : formatter(v);
  };
}
export const space = chooser([0, 8, 16, 32, 64]);
export const fontSizer = chooser([12, 14, 16, 20, 24, 32, 48, 64, 72]);


export function grey(step: number) {
  const value = Math.round(242 - step * (242 - 51) / 5);
  return rgb(value, value, value);
}
