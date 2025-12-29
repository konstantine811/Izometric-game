// src/game/ui/TileEditor.ts
import Phaser from "phaser";
import { Grid } from "../world/Grid";
import type { IsoTransform } from "../iso/isoTransofrm";
import { TILE_CONFIGS, TILES_BY_ID } from "../config/tiles";
import type { GridPoint } from "../types/grid-types";
import { TileRenderer } from "../world/TileRenderer";

export type DrawMode = "line" | "area"; // ✅ Режими малювання: лінія або площина

export class TileEditor {
  private selectedTileId: string | null = null;
  private isDrawing = false;
  private previewGraphics!: Phaser.GameObjects.Graphics; // ✅ Preview індикатор
  private startCell: GridPoint | null = null; // ✅ Початкова позиція при натисканні миші
  private drawMode: DrawMode = "line"; // ✅ Режим малювання (лінія або площина)

  public scene: Phaser.Scene;
  public grid: Grid;
  public iso: IsoTransform;
  public tileRenderer: TileRenderer;

  // ✅ Публічні методи для React компонента
  public getSelectedTileId(): string | null {
    return this.selectedTileId;
  }

  public setSelectedTileId(tileId: string | null) {
    this.selectedTileId = tileId;
    // ✅ Приховуємо preview якщо тайл не вибрано
    if (!tileId) {
      this.previewGraphics.setVisible(false);
    }
  }

  public isEditMode(): boolean {
    return this.selectedTileId !== null;
  }

  public setDrawMode(mode: DrawMode) {
    this.drawMode = mode;
  }

  public getDrawMode(): DrawMode {
    return this.drawMode;
  }

  constructor(
    scene: Phaser.Scene,
    grid: Grid,
    iso: IsoTransform,
    tileRenderer: TileRenderer
  ) {
    this.scene = scene;
    this.grid = grid;
    this.iso = iso;
    this.tileRenderer = tileRenderer;
  }

  create() {
    this.createPreview();
    this.setupInputHandlers();
  }

  private createPreview() {
    // ✅ Створюємо напівпрозорий зелений preview індикатор
    this.previewGraphics = this.scene.add.graphics();
    this.previewGraphics.setVisible(false);
    this.previewGraphics.setDepth(1000); // ✅ Над усіма іншими об'єктами
  }

  private setupInputHandlers() {
    // ✅ Обробка кліку миші для малювання
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // ✅ Перевіряємо, чи клік не по нижній частині екрана (де HTML панель)
      const screenHeight = this.scene.scale.height;
      if (pointer.y > screenHeight - 100) {
        return; // Ігноруємо кліки по HTML панелі
      }

      // ✅ Якщо вибрано тайл - починаємо малювання, інакше дозволяємо рух персонажа
      if (this.selectedTileId) {
        this.isDrawing = true;
        const cell = this.iso.screenToCell(pointer.worldX, pointer.worldY);
        if (cell && this.grid.inBounds(cell)) {
          this.startCell = { ...cell }; // ✅ Зберігаємо початкову позицію
        }
        // ✅ Тільки показуємо preview, не малюємо тайли одразу
        this.updatePreview(pointer);
        // ✅ Блокуємо подальшу обробку події для руху персонажа
        pointer.event.stopPropagation();
      }
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // ✅ Оновлюємо preview при русі миші (завжди, навіть під час малювання)
      this.updatePreview(pointer);
      // ✅ Тайли не малюються під час перетягування, тільки preview
    });

    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      // ✅ Малюємо тайли тільки при відпусканні кнопки миші
      if (this.isDrawing && this.selectedTileId && this.startCell) {
        const cell = this.iso.screenToCell(pointer.worldX, pointer.worldY);
        if (cell && this.grid.inBounds(cell)) {
          this.paintTiles(this.startCell, cell);
        }
      }

      this.isDrawing = false;
      this.startCell = null; // ✅ Скидаємо початкову позицію
    });

    // ✅ Приховуємо preview коли миша виходить за межі canvas
    this.scene.input.on("pointerout", () => {
      this.previewGraphics.setVisible(false);
    });
  }

  private updatePreview(pointer: Phaser.Input.Pointer) {
    // ✅ Показуємо preview тільки якщо вибрано тайл
    if (!this.selectedTileId) {
      this.previewGraphics.setVisible(false);
      return;
    }

    // ✅ Перевіряємо, чи курсор не над HTML панеллю
    const screenHeight = this.scene.scale.height;
    if (pointer.y > screenHeight - 100) {
      this.previewGraphics.setVisible(false);
      return;
    }

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const cell = this.iso.screenToCell(worldX, worldY);

    if (!cell || !this.grid.inBounds(cell)) {
      this.previewGraphics.setVisible(false);
      return;
    }

    const tileConfig = TILES_BY_ID.get(this.selectedTileId);
    if (!tileConfig) {
      this.previewGraphics.setVisible(false);
      return;
    }

    // ✅ Отримуємо розмір тайла в клітинках
    const gridSize = tileConfig.gridSize ?? { width: 1, height: 1 };
    const { tileW: W, tileH: H } = this.iso;

    // ✅ Очищаємо попередній preview
    this.previewGraphics.clear();

    // ✅ Якщо малюємо (перетягуємо), показуємо preview на всьому шляху або площині
    if (this.isDrawing && this.startCell) {
      let cells: GridPoint[];

      if (this.drawMode === "area") {
        // ✅ Режим площини - обчислюємо всі тайли в прямокутній області
        cells = this.getCellsInArea(this.startCell, cell);
      } else {
        // ✅ Режим лінії - обчислюємо всі тайли на лінії
        cells = this.getCellsBetween(this.startCell, cell);
      }

      // ✅ Малюємо preview на всіх тайлах
      const renderedCells = new Set<string>();
      for (const pathCell of cells) {
        if (!this.grid.inBounds(pathCell)) continue;

        // ✅ Пропускаємо, якщо ця клітинка вже частина більшого тайла
        const cellKey = `${pathCell.x},${pathCell.y}`;
        if (renderedCells.has(cellKey)) continue;

        // ✅ Обчислюємо центр області тайла
        const centerX = pathCell.x + (gridSize.width - 1) / 2;
        const centerY = pathCell.y + (gridSize.height - 1) / 2;
        const centerPoint: GridPoint = { x: centerX, y: centerY };
        const { x: sx, y: sy } = this.iso.cellToScreen(centerPoint);

        // ✅ Малюємо напівпрозорий зелений ромб з урахуванням розміру тайла
        const previewW = W * gridSize.width;
        const previewH = H * gridSize.height;

        this.previewGraphics.fillStyle(0x00ff00, 0.4); // ✅ Зелений колір, 40% прозорості
        this.previewGraphics.lineStyle(2, 0x00ff00, 0.8); // ✅ Зелений контур, 80% прозорості
        this.previewGraphics.beginPath();
        this.previewGraphics.moveTo(sx, sy - previewH / 2); // Верх
        this.previewGraphics.lineTo(sx + previewW / 2, sy); // Право
        this.previewGraphics.lineTo(sx, sy + previewH / 2); // Низ
        this.previewGraphics.lineTo(sx - previewW / 2, sy); // Ліво
        this.previewGraphics.closePath();
        this.previewGraphics.fillPath();
        this.previewGraphics.strokePath();

        // ✅ Позначаємо всі клітинки, які займає цей тайл
        for (let dy = 0; dy < gridSize.height; dy++) {
          for (let dx = 0; dx < gridSize.width; dx++) {
            const cellX = pathCell.x + dx;
            const cellY = pathCell.y + dy;
            if (cellX < this.grid.cols && cellY < this.grid.rows) {
              renderedCells.add(`${cellX},${cellY}`);
            }
          }
        }
      }
    } else {
      // ✅ Якщо не малюємо, показуємо preview тільки на поточному тайлі
      // ✅ Обчислюємо центр області тайла
      const centerX = cell.x + (gridSize.width - 1) / 2;
      const centerY = cell.y + (gridSize.height - 1) / 2;
      const centerPoint: GridPoint = { x: centerX, y: centerY };
      const { x: sx, y: sy } = this.iso.cellToScreen(centerPoint);

      const previewW = W * gridSize.width;
      const previewH = H * gridSize.height;

      this.previewGraphics.fillStyle(0x00ff00, 0.4); // ✅ Зелений колір, 40% прозорості
      this.previewGraphics.lineStyle(2, 0x00ff00, 0.8); // ✅ Зелений контур, 80% прозорості
      this.previewGraphics.beginPath();
      this.previewGraphics.moveTo(sx, sy - previewH / 2); // Верх
      this.previewGraphics.lineTo(sx + previewW / 2, sy); // Право
      this.previewGraphics.lineTo(sx, sy + previewH / 2); // Низ
      this.previewGraphics.lineTo(sx - previewW / 2, sy); // Ліво
      this.previewGraphics.closePath();
      this.previewGraphics.fillPath();
      this.previewGraphics.strokePath();
    }

    this.previewGraphics.setVisible(true);
  }

  // ✅ Алгоритм Брезенхема для знаходження всіх тайлів між двома точками
  private getCellsBetween(start: GridPoint, end: GridPoint): GridPoint[] {
    const cells: GridPoint[] = [];
    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      cells.push({ x: x0, y: y0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return cells;
  }

  // ✅ Малюємо тайли між двома точками (викликається при відпусканні кнопки миші)
  private paintTiles(start: GridPoint, end: GridPoint) {
    const tileConfig = TILES_BY_ID.get(this.selectedTileId!);
    if (!tileConfig) return;

    // ✅ Отримуємо розмір тайла в клітинках
    const gridSize = tileConfig.gridSize ?? { width: 1, height: 1 };

    let cells: GridPoint[];

    if (this.drawMode === "area") {
      // ✅ Режим площини - обчислюємо всі тайли в прямокутній області
      cells = this.getCellsInArea(start, end);
    } else {
      // ✅ Режим лінії - обчислюємо всі тайли на лінії
      cells = this.getCellsBetween(start, end);
    }

    let hasChanges = false;
    const paintedCells = new Set<string>(); // ✅ Відстежуємо вже намальовані клітинки

    for (const pathCell of cells) {
      if (!this.grid.inBounds(pathCell)) continue;

      // ✅ Перевіряємо, чи ця клітинка вже частина більшого тайла
      const cellKey = `${pathCell.x},${pathCell.y}`;
      if (paintedCells.has(cellKey)) continue;

      // ✅ Встановлюємо тайл на початковій клітинці
      this.grid.setTileType(pathCell, this.selectedTileId!, tileConfig);
      hasChanges = true;

      // ✅ Позначаємо всі клітинки, які займає цей тайл
      for (let dy = 0; dy < gridSize.height; dy++) {
        for (let dx = 0; dx < gridSize.width; dx++) {
          const cellX = pathCell.x + dx;
          const cellY = pathCell.y + dy;
          if (cellX < this.grid.cols && cellY < this.grid.rows) {
            paintedCells.add(`${cellX},${cellY}`);
            // ✅ Встановлюємо тайл на всіх клітинках, які він займає
            const cell: GridPoint = { x: cellX, y: cellY };
            this.grid.setTileType(cell, this.selectedTileId!, tileConfig);
          }
        }
      }
    }

    // ✅ Оновлюємо відображення тільки якщо були зміни
    if (hasChanges) {
      this.updateTileDisplay();
    }
  }

  // ✅ Обчислює всі тайли в прямокутній області між двома точками
  private getCellsInArea(start: GridPoint, end: GridPoint): GridPoint[] {
    const cells: GridPoint[] = [];

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        cells.push({ x, y });
      }
    }

    return cells;
  }

  private updateTileDisplay() {
    // ✅ Оновлюємо весь рендер (можна оптимізувати для оновлення одного тайла)
    this.tileRenderer.redraw();
  }

  public clearAllTiles() {
    // ✅ Очищаємо всі тайли та робимо всі місця прохідними
    for (let y = 0; y < this.grid.rows; y++) {
      for (let x = 0; x < this.grid.cols; x++) {
        const p: GridPoint = { x, y };
        // ✅ Видаляємо тайл та робимо місце прохідним
        this.grid.setTileType(p, null, TILE_CONFIGS[0]);
      }
    }
    // ✅ Додатково очищаємо всі блокування на випадок, якщо щось залишилося
    this.grid.clearAllBlocked();
    this.tileRenderer.redraw();
  }

  public saveTiles() {
    const tilesData = this.grid.getTilesData();
    const dataStr = JSON.stringify(tilesData, null, 2);

    // ✅ Зберігаємо в localStorage
    localStorage.setItem("mapTiles", dataStr);

    // ✅ Виводимо в консоль для копіювання
    console.log("Tiles saved:", dataStr);
  }

  loadTiles() {
    const saved = localStorage.getItem("mapTiles");
    if (saved) {
      try {
        const tilesData = JSON.parse(saved);
        this.grid.loadTilesData(tilesData, (tileId) => TILES_BY_ID.get(tileId));
        this.tileRenderer.redraw();
        console.log("Tiles loaded:", tilesData);
      } catch (e) {
        console.error("Failed to load tiles:", e);
      }
    }
  }

  destroy() {
    // ✅ UI тепер в React, нічого не потрібно видаляти
  }
}
