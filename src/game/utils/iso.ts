import type { GridPoint } from "../types/grid-types";

export function isoToScreen(
  gx: number,
  gy: number,
  tileW: number,
  tileH: number,
  ox: number,
  oy: number
) {
  const x = (gx - gy) * (tileW / 2) + ox;
  const y = (gx + gy) * (tileH / 2) + oy;
  return { x, y };
}

export function screenToIso(
  sx: number,
  sy: number,
  tileW: number,
  tileH: number,
  ox: number,
  oy: number
) {
  const x = (sx - ox) / (tileW / 2);
  const y = (sy - oy) / (tileH / 2);
  const gx = (x + y) / 2;
  const gy = (y - x) / 2;
  return { gx, gy };
}

export const keyOf = (p: GridPoint) => `${p.x},${p.y}`;
export const parseKey = (k: string): GridPoint => {
  const [x, y] = k.split(",").map(Number);
  return { x, y };
};
