// src/game/controllers/PlayerController.ts
import Phaser from "phaser";
import { Grid } from "../world/Grid";
import { IsoCharacter } from "../entities/IsoCharacter";
import type { GridPoint } from "../types/grid-types";
import type { IsoTransform } from "../iso/isoTransofrm";
import { clamp } from "../config/config";
import { astar } from "../utils/astar";

export class PlayerController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private path: GridPoint[] = [];

  public scene: Phaser.Scene;
  public grid: Grid;
  public iso: IsoTransform;
  public player: IsoCharacter;

  constructor(
    scene: Phaser.Scene,
    grid: Grid,
    iso: IsoTransform,
    player: IsoCharacter
  ) {
    this.scene = scene;
    this.grid = grid;
    this.iso = iso;
    this.player = player;

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys("W,A,S,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const wp = p.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
      const cell = iso.screenToCell(wp.x, wp.y);
      if (!cell) return;
      if (grid.isBlocked(cell)) return;

      const route = astar(player.cell, cell, {
        cols: grid.cols,
        rows: grid.rows,
        isBlocked: (pt) => grid.isBlocked(pt),
        diagonal: true,
      });

      this.path = route.length > 1 ? route.slice(1) : [];
    });
  }

  update() {
    if (!this.player.moving && this.path.length) {
      const nextCell = this.path.shift()!;
      const hasMoreMoves = this.path.length > 0;
      this.player.moveTo(nextCell, undefined, hasMoreMoves);
      return;
    }

    if (this.player.moving) return;

    const dx =
      (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) +
      (this.cursors.left.isDown || this.wasd.A.isDown ? -1 : 0);

    const dy =
      (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) +
      (this.cursors.up.isDown || this.wasd.W.isDown ? -1 : 0);

    // ✅ Якщо гравець не рухається і клавіші не натиснуті, перемикаємо на idle
    if (dx === 0 && dy === 0) {
      const walkKey = `${this.player.sprite.texture.key}-walk`;
      if (this.player.sprite.anims.currentAnim?.key === walkKey) {
        this.player.playIdle();
      }
      return;
    }

    const target = {
      x: clamp(this.player.cell.x + Math.sign(dx), 0, this.grid.cols - 1),
      y: clamp(this.player.cell.y + Math.sign(dy), 0, this.grid.rows - 1),
    };

    if (this.grid.isBlocked(target)) return;
    this.path = [];

    // ✅ Перевіряємо, чи клавіша все ще натиснута - якщо так, це не останній рух
    const stillPressed =
      this.cursors.right.isDown ||
      this.wasd.D.isDown ||
      this.cursors.left.isDown ||
      this.wasd.A.isDown ||
      this.cursors.down.isDown ||
      this.wasd.S.isDown ||
      this.cursors.up.isDown ||
      this.wasd.W.isDown;

    this.player.moveTo(target, undefined, stillPressed);
  }
}
