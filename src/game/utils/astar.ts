import type { GridPoint } from "../types/grid-types";
import { keyOf, parseKey } from "./iso";

export type Grid = {
  cols: number;
  rows: number;
  isBlocked: (p: GridPoint) => boolean;
  diagonal?: boolean;
};

function heuristic(a: GridPoint, b: GridPoint, diagonal: boolean) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (!diagonal) return dx + dy;

  // Octile
  const F = Math.SQRT2 - 1;
  return dx < dy ? F * dx + dy : F * dy + dx;
}

function neighbors(p: GridPoint, grid: Grid) {
  const { cols, rows, diagonal } = grid;
  const list: Array<{ p: GridPoint; cost: number }> = [];

  const add = (x: number, y: number, cost: number) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    list.push({ p: { x, y }, cost });
  };

  add(p.x + 1, p.y, 1);
  add(p.x - 1, p.y, 1);
  add(p.x, p.y + 1, 1);
  add(p.x, p.y - 1, 1);

  if (diagonal) {
    add(p.x + 1, p.y + 1, Math.SQRT2);
    add(p.x + 1, p.y - 1, Math.SQRT2);
    add(p.x - 1, p.y + 1, Math.SQRT2);
    add(p.x - 1, p.y - 1, Math.SQRT2);
  }

  return list;
}

function reconstruct(cameFrom: Map<string, string>, current: string) {
  const path: string[] = [current];
  let cur = current;
  while (cameFrom.has(cur)) {
    cur = cameFrom.get(cur)!;
    path.push(cur);
  }
  path.reverse();
  return path.map(parseKey);
}

function bestOpen(open: string[], fScore: Map<string, number>) {
  let best = open[0];
  let bestF = fScore.get(best) ?? Infinity;
  for (let i = 1; i < open.length; i++) {
    const k = open[i];
    const f = fScore.get(k) ?? Infinity;
    if (f < bestF) {
      bestF = f;
      best = k;
    }
  }
  return best;
}

export function astar(
  start: GridPoint,
  goal: GridPoint,
  grid: Grid
): GridPoint[] {
  const diagonal = !!grid.diagonal;
  const startKey = keyOf(start);
  const goalKey = keyOf(goal);

  const open: string[] = [startKey];
  const closed = new Set<string>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([
    [startKey, heuristic(start, goal, diagonal)],
  ]);

  while (open.length) {
    const currentKey = bestOpen(open, fScore);
    if (currentKey === goalKey) return reconstruct(cameFrom, currentKey);

    // remove current
    open.splice(open.indexOf(currentKey), 1);
    closed.add(currentKey);

    const current = parseKey(currentKey);
    const curG = gScore.get(currentKey) ?? Infinity;

    for (const n of neighbors(current, grid)) {
      const nk = keyOf(n.p);
      if (closed.has(nk)) continue;
      if (grid.isBlocked(n.p)) continue;

      const tentativeG = curG + n.cost;
      const prevG = gScore.get(nk);

      if (prevG === undefined || tentativeG < prevG) {
        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + heuristic(n.p, goal, diagonal));
        if (!open.includes(nk)) open.push(nk);
      }
    }
  }

  return [];
}
