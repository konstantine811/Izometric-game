import kaboom, { type KaboomCtx } from "kaboom";
import { clamp, isoToScreen, screenToIso } from "../utils/iso";
import type { Point } from "../types/grid-types";
import { astar } from "../utils/astar";

type Options = {
  canvas: HTMLCanvasElement;
};

export function createKaboomGame({ canvas }: Options) {
  const k = kaboom({
    canvas,
    width: canvas.clientWidth || 1100,
    height: canvas.clientHeight || 700,
    background: [10, 10, 14],
    crisp: true,
  });

  start(k).catch((error) => {
    console.error("Failed to start game:", error);
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  return () => {
    k.quit();
  };
}

async function start(k: KaboomCtx) {
  // --- CONFIG ---
  const COLS = 20;
  const ROWS = 14;
  const TILE_W = 64;
  const TILE_H = 32;
  const DIAGONAL = true;

  const blocked = new Uint8Array(COLS * ROWS);

  const idx = (p: Point) => p.y * COLS + p.x;
  const isBlocked = (p: Point) => blocked[idx(p)] === 1;
  const setBlocked = (p: Point, v: 0 | 1) => (blocked[idx(p)] = v);

  const calcOrigin = () => {
    const ox = k.width() / 2 - ((COLS - ROWS) * TILE_W) / 4;
    const oy = k.height() / 2 - ((COLS + ROWS) * TILE_H) / 4;
    return { ox, oy };
  };

  let { ox, oy } = calcOrigin();

  const cellToWorld = (p: Point) =>
    isoToScreen(p.x, p.y, TILE_W, TILE_H, ox, oy);
  const worldToCell = (wx: number, wy: number): Point | null => {
    const { gx, gy } = screenToIso(wx, wy, TILE_W, TILE_H, ox, oy);
    const x = Math.floor(gx + 0.5);
    const y = Math.floor(gy + 0.5);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
    return { x, y };
  };

  // --- LOAD HERO SPRITESHEET ---
  let heroLoaded = false;
  try {
    await k.loadSprite("hero", "/sprites/bean.png");
    heroLoaded = true;
    console.log("Hero sprite loaded successfully");
  } catch (error) {
    console.error("Error loading hero sprite:", error);
    heroLoaded = false;
  }

  // --- DEMO WALLS ---
  for (let x = 9; x < 16; x++) setBlocked({ x, y: 6 }, 1);
  for (let y = 7; y < 10; y++) setBlocked({ x: 15, y }, 1);

  // --- UI ---
  k.add([
    k.text("Shift+Click: wall • Click: move (A*) • WASD/Arrows: step", {
      size: 14,
    }),
    k.pos(16, 14),
    k.fixed(),
    k.color(220, 220, 220),
  ]);

  // --- PLAYER ---
  let playerCell: Point = { x: 3, y: 8 };
  let moving = false;
  let queuedPath: Point[] = [];

  // Створюємо гравця ПІСЛЯ завантаження спрайта
  const player = heroLoaded
    ? k.add([k.sprite("hero"), k.pos(0, 0), k.rotate(0)])
    : k.add([
        k.rect(16, 16),
        k.color(255, 0, 0),
        k.pos(0, 0),
        k.anchor("center"),
        k.z(1000000),
      ]);

  placePlayer(playerCell);

  function placePlayer(cell: Point) {
    const p = cellToWorld(cell);
    player.pos = k.vec2(p.x, p.y - 6);
    playerCell = cell;
  }

  function drawDiamond(
    cx: number,
    cy: number,
    w: number,
    h: number,
    fill: number[],
    outline?: number[]
  ) {
    const pts = [
      k.vec2(cx, cy - h / 2),
      k.vec2(cx + w / 2, cy),
      k.vec2(cx, cy + h / 2),
      k.vec2(cx - w / 2, cy),
    ];
    k.drawPolygon({
      pts,
      color: k.rgb(fill[0], fill[1], fill[2]),
      outline: outline
        ? { color: k.rgb(outline[0], outline[1], outline[2]), width: 1 }
        : undefined,
    });
  }

  // --- MAP RENDER ---
  k.onDraw(() => {
    ({ ox, oy } = calcOrigin());

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = { x, y };
        const s = cellToWorld(cell);

        if (isBlocked(cell)) {
          drawDiamond(s.x, s.y, TILE_W, TILE_H, [20, 20, 20], [60, 60, 60]);
        } else {
          drawDiamond(s.x, s.y, TILE_W, TILE_H, [235, 235, 235], [0, 0, 0]);
        }
      }
    }
  });

  k.onMousePress(() => {
    const m = k.mousePos();
    const cell = worldToCell(m.x, m.y);
    if (!cell) return;

    if (k.isKeyDown("shift")) {
      if (cell.x === playerCell.x && cell.y === playerCell.y) return;
      setBlocked(cell, isBlocked(cell) ? 0 : 1);
      queuedPath = [];
      return;
    }

    if (isBlocked(cell)) return;

    const path = astar(playerCell, cell, {
      cols: COLS,
      rows: ROWS,
      isBlocked,
      diagonal: DIAGONAL,
    });

    queuedPath = path.length > 1 ? path.slice(1) : [];
  });

  const stepMove = (dx: number, dy: number) => {
    if (moving) return;
    const target = {
      x: clamp(playerCell.x + dx, 0, COLS - 1),
      y: clamp(playerCell.y + dy, 0, ROWS - 1),
    };
    if (isBlocked(target)) return;
    queuedPath = [];
    moveToCell(target);
  };

  k.onKeyPress("w", () => stepMove(0, -1));
  k.onKeyPress("s", () => stepMove(0, 1));
  k.onKeyPress("a", () => stepMove(-1, 0));
  k.onKeyPress("d", () => stepMove(1, 0));
  k.onKeyPress("up", () => stepMove(0, -1));
  k.onKeyPress("down", () => stepMove(0, 1));
  k.onKeyPress("left", () => stepMove(-1, 0));
  k.onKeyPress("right", () => stepMove(1, 0));

  k.onUpdate(() => {
    if (!moving && queuedPath.length) {
      moveToCell(queuedPath.shift()!);
    }
  });

  function tweenPos(toX: number, toY: number, duration: number) {
    return new Promise<void>((resolve) => {
      const from = player.pos.clone();
      k.tween(
        from,
        k.vec2(toX, toY),
        duration,
        (v) => {
          player.pos = v;
        },
        k.easings.easeOutSine
      );
      k.wait(duration, resolve);
    });
  }

  async function moveToCell(cell: Point) {
    moving = true;
    if (heroLoaded && "play" in player) {
      // player.play("walk");
    }

    const p = cellToWorld(cell);
    const target = { x: p.x, y: p.y - 6 };
    await tweenPos(target.x, target.y, 0.14);

    playerCell = cell;
    moving = false;
    if (heroLoaded && "play" in player) {
      // player.play("idle");
    }
  }
}
