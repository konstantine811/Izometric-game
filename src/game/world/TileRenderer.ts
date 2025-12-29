// src/game/world/TileRenderer.ts
import Phaser from "phaser";
import { Grid } from "./Grid";
import type { IsoTransform } from "../iso/isoTransofrm";
import type { GridPoint } from "../types/grid-types";
import { TILE_CONFIGS } from "../config/tiles";

export class TileRenderer {
  private layer!: Phaser.GameObjects.Container;

  public scene: Phaser.Scene;
  public grid: Grid;
  public iso: IsoTransform;

  constructor(scene: Phaser.Scene, grid: Grid, iso: IsoTransform) {
    this.scene = scene;
    this.grid = grid;
    this.iso = iso;
  }

  create() {
    this.createTileTextures();
    this.layer = this.scene.add.container(0, 0);
    this.redraw();
  }

  redraw() {
    this.layer.removeAll(true);
    const { tileW: W, tileH: H } = this.iso;
    const renderedTiles = new Set<string>(); // ✅ Відстежуємо вже відрендерені тайли

    for (let y = 0; y < this.grid.rows; y++) {
      for (let x = 0; x < this.grid.cols; x++) {
        const p: GridPoint = { x, y };
        const cellKey = `${x},${y}`;

        // ✅ Пропускаємо, якщо ця клітинка вже частина більшого тайла
        if (renderedTiles.has(cellKey)) continue;

        // ✅ Отримуємо тип тайла або використовуємо дефолтний
        const tileId = this.grid.getTileType(p) || "floor";
        const key = `tile-${tileId}`;
        const tileConfig = TILE_CONFIGS.find((t) => t.id === tileId);

        // ✅ Отримуємо розмір тайла в клітинках
        const gridSize = tileConfig?.gridSize ?? { width: 1, height: 1 };
        const gridW = gridSize.width;
        const gridH = gridSize.height;

        // ✅ Обчислюємо центр області тайла
        const centerX = x + (gridW - 1) / 2;
        const centerY = y + (gridH - 1) / 2;
        const centerPoint: GridPoint = { x: centerX, y: centerY };
        const { x: sx, y: sy } = this.iso.cellToScreen(centerPoint);

        const spr = this.scene.add.image(sx, sy, key).setOrigin(0.5, 0.5);

        // ✅ Застосовуємо масштабування з конфігурації
        const scale = tileConfig?.scale ?? 1;
        const scaleX = typeof scale === "number" ? scale : scale.x;
        const scaleY = typeof scale === "number" ? scale : scale.y;

        // ✅ Фіксуємо розмір зображення до розміру тайла з урахуванням кількості клітинок та масштабу
        spr.setDisplaySize(W * gridW * scaleX, H * gridH * scaleY);

        // ✅ Вимкнемо фільтри та ефекти, які можуть додавати контур
        spr.setTint(0xffffff); // Без відтінку
        spr.setAlpha(1); // Повна непрозорість

        // ✅ Встановлюємо фільтр для уникнення артефактів при масштабуванні
        if (spr.texture) {
          spr.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        this.layer.add(spr);

        // ✅ Позначаємо всі клітинки, які займає цей тайл
        for (let dy = 0; dy < gridH; dy++) {
          for (let dx = 0; dx < gridW; dx++) {
            const cellX = x + dx;
            const cellY = y + dy;
            if (cellX < this.grid.cols && cellY < this.grid.rows) {
              renderedTiles.add(`${cellX},${cellY}`);
            }
          }
        }
      }
    }
  }

  private createTileTextures() {
    const { tileW: W, tileH: H } = this.iso;

    // ✅ Створюємо текстури для всіх типів тайлів
    for (const tileConfig of TILE_CONFIGS) {
      const key = `tile-${tileConfig.id}`;
      if (this.scene.textures.exists(key)) continue;

      if (!tileConfig.imageUrl) {
        // ✅ Fallback: програмне малювання з кольором (без контуру)
        const g = this.scene.add.graphics();
        g.fillStyle(tileConfig.color, 1);
        // ✅ Прибираємо контур для чистішого вигляду
        g.beginPath();
        g.moveTo(W / 2, 0);
        g.lineTo(W, H / 2);
        g.lineTo(W / 2, H);
        g.lineTo(0, H / 2);
        g.closePath();
        g.fillPath();
        // ✅ Не додаємо strokePath() щоб не було контуру
        g.generateTexture(key, W, H);
        g.destroy();
      }
      // Якщо imageUrl вказано, зображення вже завантажено через preload
      // Використовуємо його безпосередньо
    }
  }
}
