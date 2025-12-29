import Phaser from "phaser";

import { isoToScreen, screenToIso } from "../utils/iso";
import { astar } from "../utils/astar";
import type { GridPoint } from "../types/grid-types";

const TILE_W = 64;
const TILE_H = 32;

const COLS = 240;
const ROWS = 240;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class IsoScene extends Phaser.Scene {
  private ox = 0;
  private oy = 0;

  private blocked = new Uint8Array(COLS * ROWS); // 0 free, 1 wall
  private floorTexKey = "floor";
  private wallTexKey = "wall";

  private player!: Phaser.GameObjects.Sprite;
  private playerCell: GridPoint = { x: 3, y: 8 };
  private moving = false;
  private path: GridPoint[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("IsoScene");
  }

  private static HERO_KEY = "hero";

  preload() {
    // ✅ тимчасово став будь-які frameWidth/frameHeight (потім уточнимо)
    // ВАЖЛИВО: якщо frame не співпаде — спрайт може виглядати дивно,
    // але ми зможемо це швидко перевірити через debug нижче.
    const FRAME_W = 184;
    const FRAME_H = 325;

    this.load.spritesheet(IsoScene.HERO_KEY, "/sprites/capguy-walk-1472.png", {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
      // якщо у файлі є відступи між кадрами:
      // margin: 0,
      // spacing: 0,
    });
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    // центр
    this.recalcOrigin();

    // демо-стіни (можеш прибрати)
    for (let x = 9; x < 16; x++) this.setBlocked({ x, y: 6 }, true);
    for (let y = 7; y < 10; y++) this.setBlocked({ x: 15, y }, true);

    this.createTileTextures();
    this.drawMap();

    this.player = this.add.sprite(0, 0, this.makePlayerTexture());
    this.player.setOrigin(0.5, 0.85);
    this.placePlayer(this.playerCell);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    // клік по тайлу -> A* -> рух
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const cell = this.pickCell(p.worldX, p.worldY);
      if (!cell) return;
      if (this.isBlocked(cell)) return;

      const route = astar(this.playerCell, cell, {
        cols: COLS,
        rows: ROWS,
        isBlocked: (pt) => this.isBlocked(pt),
        diagonal: true,
      });

      if (route.length > 1) {
        // перший елемент — поточна клітинка, пропускаємо
        this.path = route.slice(1);
      }
    });

    this.scale.on("resize", () => {
      this.recalcOrigin();
      this.redraw();
      this.placePlayer(this.playerCell);
      // ✅ спочатку миттєво центруємо камеру на гравця
    });
  }

  update() {
    // якщо є шлях — крокаємо по ньому
    if (!this.moving && this.path.length) {
      this.moveToCell(this.path.shift()!);
      return;
    }

    // якщо не рухаємось — керування клавіатурою (крокове)
    if (this.moving) return;

    const dx =
      (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) +
      (this.cursors.left.isDown || this.wasd.A.isDown ? -1 : 0);

    const dy =
      (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) +
      (this.cursors.up.isDown || this.wasd.W.isDown ? -1 : 0);

    if (dx === 0 && dy === 0) {
      this.player.play("hero-idle", true);
      return;
    }

    // один крок за раз
    const target = {
      x: clamp(this.playerCell.x + Math.sign(dx), 0, COLS - 1),
      y: clamp(this.playerCell.y + Math.sign(dy), 0, ROWS - 1),
    };

    if (this.isBlocked(target)) {
      this.player.play("hero-idle", true);
      return;
    }
    this.player.play("hero-walk", true);
    this.moveToCell(target);
  }

  // --- grid helpers
  private idx(p: GridPoint) {
    return p.y * COLS + p.x;
  }

  private isBlocked(p: GridPoint) {
    return this.blocked[this.idx(p)] === 1;
  }

  private setBlocked(p: GridPoint, v: boolean) {
    this.blocked[this.idx(p)] = v ? 1 : 0;
  }

  // --- iso origin
  private recalcOrigin() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.ox = w / 2 - ((COLS - ROWS) * TILE_W) / 4;
    this.oy = h / 2 - ((COLS + ROWS) * TILE_H) / 4;
  }

  private pickCell(sx: number, sy: number): GridPoint | null {
    const { gx, gy } = screenToIso(sx, sy, TILE_W, TILE_H, this.ox, this.oy);
    const x = Math.floor(gx + 0.5);
    const y = Math.floor(gy + 0.5);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
    return { x, y };
  }

  private cellToScreen(p: GridPoint) {
    return isoToScreen(p.x, p.y, TILE_W, TILE_H, this.ox, this.oy);
  }

  // --- draw
  private createTileTextures() {
    // floor
    const g1 = this.add.graphics();
    g1.fillStyle(0xf2f2f2, 1);
    g1.lineStyle(1, 0x000000, 0.15);
    g1.beginPath();
    g1.moveTo(TILE_W / 2, 0);
    g1.lineTo(TILE_W, TILE_H / 2);
    g1.lineTo(TILE_W / 2, TILE_H);
    g1.lineTo(0, TILE_H / 2);
    g1.closePath();
    g1.fillPath();
    g1.strokePath();
    g1.generateTexture(this.floorTexKey, TILE_W + 2, TILE_H + 2);
    g1.destroy();

    // wall
    const g2 = this.add.graphics();
    g2.fillStyle(0x111111, 1);
    g2.beginPath();
    g2.moveTo(TILE_W / 2, 0);
    g2.lineTo(TILE_W, TILE_H / 2);
    g2.lineTo(TILE_W / 2, TILE_H);
    g2.lineTo(0, TILE_H / 2);
    g2.closePath();
    g2.fillPath();
    g2.generateTexture(this.wallTexKey, TILE_W + 2, TILE_H + 2);
    g2.destroy();
  }

  private drawMap() {
    // правильний порядок малювання в ізометрії
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const p = { x, y };
        const { x: sx, y: sy } = this.cellToScreen(p);

        const key = this.isBlocked(p) ? this.wallTexKey : this.floorTexKey;
        const spr = this.add.image(sx, sy, key);
        spr.setOrigin(0.5, 0.5);
      }
    }
  }

  private createHeroAnims() {
    // Якщо анімації вже створені (Phaser кешує), пропускаємо
    if (this.anims.exists("hero-idle")) return;

    // ⚠️ Тут треба правильні ranges під твій sheet.
    // Для старту зробимо простий тест: idle = кадри 0..7, walk = 8..15.
    // Якщо кадри не ті — скажеш скільки колонок/рядків, і я дам точні.
    this.anims.create({
      key: "hero-idle",
      frames: this.anims.generateFrameNumbers(IsoScene.HERO_KEY, {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
    });

    this.anims.create({
      key: "hero-walk",
      frames: this.anims.generateFrameNumbers(IsoScene.HERO_KEY, {
        start: 0,
        end: 7,
      }),
      frameRate: 20,
      repeat: -1,
    });

    // ✅ Debug: перевіримо, що текстура реально завантажилась і які її розміри
    const img = this.textures
      .get(IsoScene.HERO_KEY)
      .getSourceImage() as HTMLImageElement;
    console.log("HERO image size:", img?.width, img?.height);
    console.log(
      "HERO frames:",
      this.textures.get(IsoScene.HERO_KEY).frameTotal
    );
  }

  private redraw() {
    this.children.removeAll(true);
    this.createTileTextures();
    this.drawMap();
    this.createHeroAnims();

    this.player = this.add.sprite(0, 0, IsoScene.HERO_KEY);
    this.player.setOrigin(0.5, 0.85);
    this.player.setScale(0.4);
    this.placePlayer(this.playerCell);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  // --- player
  private makePlayerTexture() {
    const key = "player";
    if (this.textures.exists(key)) return key;

    const g = this.add.graphics();
    g.fillStyle(0xe11d48, 1);
    g.fillRoundedRect(0, 0, 22, 30, 6);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeRoundedRect(0, 0, 22, 30, 6);
    g.generateTexture(key, 22, 30);
    g.destroy();
    return key;
  }

  private placePlayer(cell: GridPoint) {
    const { x, y } = this.cellToScreen(cell);
    this.player.setPosition(x, y);
    this.playerCell = cell;
  }

  private moveToCell(cell: GridPoint) {
    this.moving = true;

    const { x, y } = this.cellToScreen(cell);

    // піднімаємо трохи по Y для відчуття “стояння на тайлі”
    const targetY = y - 2;

    this.tweens.add({
      targets: this.player,
      x,
      y: targetY,
      duration: 140,
      ease: "Sine.out",
      onComplete: () => {
        this.playerCell = cell;
        this.moving = false;
      },
    });
  }
}
