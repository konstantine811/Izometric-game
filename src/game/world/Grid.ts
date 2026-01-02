// src/game/world/Grid.ts

import type { GridPoint } from "../types/grid-types";
import type { TileConfig } from "../config/tiles";

export class Grid {
  private blocked: Uint8Array;
  private tileTypes: Map<number, string> = new Map(); // ✅ Зберігаємо типи тайлів

  public cols: number;
  public rows: number;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.blocked = new Uint8Array(cols * rows);
  }

  private idx(p: GridPoint) {
    return p.y * this.cols + p.x;
  }

  inBounds(p: GridPoint) {
    return p.x >= 0 && p.y >= 0 && p.x < this.cols && p.y < this.rows;
  }

  isBlocked(p: GridPoint) {
    return this.blocked[this.idx(p)] === 1;
  }

  setBlocked(p: GridPoint, v: boolean) {
    this.blocked[this.idx(p)] = v ? 1 : 0;
  }

  // ✅ Отримати тип тайла
  getTileType(p: GridPoint): string | null {
    const idx = this.idx(p);
    return this.tileTypes.get(idx) || null;
  }

  // ✅ Встановити тип тайла
  setTileType(p: GridPoint, tileId: string | null, tileConfig: TileConfig) {
    const idx = this.idx(p);
    if (tileId) {
      this.tileTypes.set(idx, tileId);
      this.setBlocked(p, !tileConfig.walkable);
    } else {
      this.tileTypes.delete(idx);
      this.setBlocked(p, false);
    }
  }

  // ✅ Отримати всі тайли для збереження
  getTilesData(): Array<{ x: number; y: number; tileId: string }> {
    const tiles: Array<{ x: number; y: number; tileId: string }> = [];
    for (const [idx, tileId] of this.tileTypes.entries()) {
      const x = idx % this.cols;
      const y = Math.floor(idx / this.cols);
      tiles.push({ x, y, tileId });
    }
    return tiles;
  }

  // ✅ Завантажити тайли з даних
  loadTilesData(
    tiles: Array<{ x: number; y: number; tileId: string }>,
    getTileConfig: (tileId: string) => TileConfig | undefined
  ) {
    // ✅ Спочатку очищаємо всі тайли та блокування
    this.tileTypes.clear();
    this.blocked.fill(0); // ✅ Очищаємо всі блокування - всі місця стають прохідними

    // ✅ Завантажуємо тайли та встановлюємо блокування на основі walkable
    for (const tile of tiles) {
      const p: GridPoint = { x: tile.x, y: tile.y };
      if (this.inBounds(p)) {
        const tileConfig = getTileConfig(tile.tileId);
        if (tileConfig) {
          // ✅ Встановлюємо тайл та блокування на основі walkable
          this.setTileType(p, tile.tileId, tileConfig);
        }
      }
    }
  }

  // ✅ Очистити всі блокування (зробити всі місця прохідними)
  clearAllBlocked() {
    this.blocked.fill(0);
  }

  // демо
  setDemoWalls() {
    for (let x = 9; x < 16; x++) this.setBlocked({ x, y: 6 }, true);
    for (let y = 7; y < 10; y++) this.setBlocked({ x: 15, y }, true);
  }

  // ✅ Створити локацію з будинками, рікою та дорогою
  createVillageLocation(getTileConfig: (tileId: string) => TileConfig | undefined) {
    // Очищаємо попередні дані
    this.tileTypes.clear();
    this.blocked.fill(0);

    const SCALE = 4; // ✅ Масштабний коефіцієнт (все в 4 рази більше)

    // === РІКА (вертикальна, з води - синя) ===
    for (let y = 0; y < this.rows; y++) {
      // Ріка шириною 12 клітинок (було 3, тепер 3×4)
      for (let x = 38 * SCALE; x <= 40 * SCALE; x++) {
        const p = { x, y };
        if (this.inBounds(p)) {
          const config = getTileConfig('water');
          if (config) this.setTileType(p, 'water', config);
        }
      }
    }

    // === ДОРОГА (горизонтальна, з каменю - сіра) ===
    for (let x = 0; x < this.cols; x++) {
      // Дорога шириною 12 клітинок (було 3, тепер 3×4)
      for (let y = 24 * SCALE; y <= 26 * SCALE; y++) {
        const p = { x, y };
        if (this.inBounds(p)) {
          // Пропускаємо ріку (створюємо міст)
          if (x >= 38 * SCALE && x <= 40 * SCALE) continue;
          const config = getTileConfig('stone');
          if (config) this.setTileType(p, 'stone', config);
        }
      }
    }

    // === МІСТ через ріку (з каменю) ===
    for (let x = 38 * SCALE; x <= 40 * SCALE; x++) {
      for (let y = 24 * SCALE; y <= 26 * SCALE; y++) {
        const p = { x, y };
        const config = getTileConfig('stone');
        if (config) this.setTileType(p, 'stone', config);
      }
    }

    // === ВЕЛИКІ БУДИНКИ З КІМНАТАМИ (масштабовані) ===
    // Будинок 1 - верхній лівий (з вітальнею, кухнею, спальнею)
    this.buildLargeHouse1({ x: 2 * SCALE, y: 2 * SCALE }, getTileConfig, SCALE);

    // Будинок 2 - верхній правий (з залом, кабінетом, сховищем)
    this.buildLargeHouse2({ x: 45 * SCALE, y: 3 * SCALE }, getTileConfig, SCALE);

    // Будинок 3 - нижній (з магазином, складом, житлом)
    this.buildLargeHouse3({ x: 5 * SCALE, y: 30 * SCALE }, getTileConfig, SCALE);
  }

  // ✅ БУДИНОК 1: Великий будинок з вітальнею, кухнею, спальнею (15×12 × scale)
  private buildLargeHouse1(topLeft: GridPoint, getTileConfig: (tileId: string) => TileConfig | undefined, scale = 1) {
    const wallCfg = getTileConfig('wall');
    const stoneCfg = getTileConfig('stone');
    if (!wallCfg || !stoneCfg) return;

    const width = 15 * scale;
    const height = 12 * scale;

    // Зовнішні стіни
    this.drawRect(topLeft, width, height, 'wall', wallCfg);

    // Головний вхід (внизу по центру) - масштабований
    for (let dx = 0; dx < scale; dx++) {
      this.clearTile({ x: topLeft.x + 7 * scale + dx, y: topLeft.y + height - 1 });
    }

    // Внутрішні стіни (створюють кімнати)
    // Горизонтальна стіна (розділяє верх і низ)
    for (let x = topLeft.x + scale; x < topLeft.x + width - scale; x++) {
      const p = { x, y: topLeft.y + 6 * scale };
      if (x < topLeft.x + 7 * scale || x > topLeft.x + 7 * scale + scale - 1) { // Двері в коридорі (scale клітинок)
        if (this.inBounds(p)) this.setTileType(p, 'wall', wallCfg);
      }
    }

    // Вертикальна стіна (розділяє ліву і праву частини)
    for (let y = topLeft.y + scale; y < topLeft.y + 6 * scale; y++) {
      const p = { x: topLeft.x + 8 * scale, y };
      if (y < topLeft.y + 3 * scale || y > topLeft.y + 3 * scale + scale - 1) { // Двері між кімнатами
        if (this.inBounds(p)) this.setTileType(p, 'wall', wallCfg);
      }
    }

    // Кухня (права верхня) - столи з каменю (масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 10 * scale + dx, y: topLeft.y + 2 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 11 * scale + dx, y: topLeft.y + 2 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 12 * scale + dx, y: topLeft.y + 4 * scale + dy }, 'stone', stoneCfg);
      }
    }

    // Спальня (ліва верхня) - ліжко з каменю (масштабоване)
    for (let dx = 0; dx < scale * 2; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 3 * scale + dx, y: topLeft.y + 2 * scale + dy }, 'stone', stoneCfg);
      }
    }

    // Вітальня (нижня частина) - меблі (масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 4 * scale + dx, y: topLeft.y + 8 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 10 * scale + dx, y: topLeft.y + 8 * scale + dy }, 'stone', stoneCfg);
      }
    }
  }

  // ✅ БУДИНОК 2: Великий будинок з залом, кабінетом, сховищем (14×13 × scale)
  private buildLargeHouse2(topLeft: GridPoint, getTileConfig: (tileId: string) => TileConfig | undefined, scale = 1) {
    const wallCfg = getTileConfig('wall');
    const stoneCfg = getTileConfig('stone');
    const waterCfg = getTileConfig('water');
    if (!wallCfg || !stoneCfg || !waterCfg) return;

    const width = 14 * scale;
    const height = 13 * scale;

    // Зовнішні стіни
    this.drawRect(topLeft, width, height, 'wall', wallCfg);

    // Головний вхід (зліва по центру) - масштабований
    for (let dy = 0; dy < scale; dy++) {
      this.clearTile({ x: topLeft.x, y: topLeft.y + 6 * scale + dy });
    }

    // Коридор вертикальний
    for (let y = topLeft.y + scale; y < topLeft.y + height - scale; y++) {
      const p = { x: topLeft.x + 4 * scale, y };
      const isDoor1 = y >= topLeft.y + 4 * scale && y < topLeft.y + 4 * scale + scale;
      const isDoor2 = y >= topLeft.y + 9 * scale && y < topLeft.y + 9 * scale + scale;
      if (!isDoor1 && !isDoor2) {
        if (this.inBounds(p)) this.setTileType(p, 'wall', wallCfg);
      }
    }

    // Сховище (верхня ліва кімната) - скарби з води (блискучі, масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale * 2; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 2 * scale + dx, y: topLeft.y + 2 * scale + dy }, 'water', waterCfg);
      }
    }

    // Кабінет (нижня ліва) - стіл (масштабований)
    for (let dx = 0; dx < scale * 2; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 2 * scale + dx, y: topLeft.y + 10 * scale + dy }, 'stone', stoneCfg);
      }
    }

    // Великий зал (права частина) - колони (масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 7 * scale + dx, y: topLeft.y + 3 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 11 * scale + dx, y: topLeft.y + 3 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 7 * scale + dx, y: topLeft.y + 9 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 11 * scale + dx, y: topLeft.y + 9 * scale + dy }, 'stone', stoneCfg);
      }
    }

    // Центральний стіл у залі (масштабований)
    for (let x = topLeft.x + 8 * scale; x < topLeft.x + 11 * scale; x++) {
      for (let y = topLeft.y + 6 * scale; y < topLeft.y + 8 * scale; y++) {
        this.setTileIfEmpty({ x, y }, 'stone', stoneCfg);
      }
    }
  }

  // ✅ БУДИНОК 3: Магазин з складом та житлом (18×14 × scale)
  private buildLargeHouse3(topLeft: GridPoint, getTileConfig: (tileId: string) => TileConfig | undefined, scale = 1) {
    const wallCfg = getTileConfig('wall');
    const stoneCfg = getTileConfig('stone');
    const waterCfg = getTileConfig('water');
    if (!wallCfg || !stoneCfg || !waterCfg) return;

    const width = 18 * scale;
    const height = 14 * scale;

    // Зовнішні стіни
    this.drawRect(topLeft, width, height, 'wall', wallCfg);

    // Два входи: для покупців і для складу (масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      this.clearTile({ x: topLeft.x + 6 * scale + dx, y: topLeft.y }); // Вхід у магазин (верх)
    }
    for (let dy = 0; dy < scale; dy++) {
      this.clearTile({ x: topLeft.x + width - 1, y: topLeft.y + 7 * scale + dy }); // Вхід на склад (справа)
    }

    // Поділ на магазин (ліва частина) і склад+житло (права)
    for (let y = topLeft.y + scale; y < topLeft.y + height - scale; y++) {
      const p = { x: topLeft.x + 9 * scale, y };
      const isDoor = y >= topLeft.y + 6 * scale && y < topLeft.y + 6 * scale + scale;
      if (!isDoor) {
        if (this.inBounds(p)) this.setTileType(p, 'wall', wallCfg);
      }
    }

    // Поділ складу і житла (горизонтально справа)
    for (let x = topLeft.x + 10 * scale; x < topLeft.x + width - scale; x++) {
      const p = { x, y: topLeft.y + 7 * scale };
      const isDoor = x >= topLeft.x + 13 * scale && x < topLeft.x + 13 * scale + scale;
      if (!isDoor) {
        if (this.inBounds(p)) this.setTileType(p, 'wall', wallCfg);
      }
    }

    // Магазин - прилавок і товари (масштабовані)
    // Прилавок (горизонтальний по центру)
    for (let x = topLeft.x + 2 * scale; x < topLeft.x + 8 * scale; x++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x, y: topLeft.y + 6 * scale + dy }, 'stone', stoneCfg);
      }
    }
    
    // Товари (вода = блискучі речі, масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 3 * scale + dx, y: topLeft.y + 3 * scale + dy }, 'water', waterCfg);
        this.setTileIfEmpty({ x: topLeft.x + 6 * scale + dx, y: topLeft.y + 3 * scale + dy }, 'water', waterCfg);
        this.setTileIfEmpty({ x: topLeft.x + 3 * scale + dx, y: topLeft.y + 10 * scale + dy }, 'water', waterCfg);
      }
    }

    // Склад - ящики (масштабовані)
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 11 * scale + dx, y: topLeft.y + 2 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 12 * scale + dx, y: topLeft.y + 2 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 14 * scale + dx, y: topLeft.y + 3 * scale + dy }, 'stone', stoneCfg);
        this.setTileIfEmpty({ x: topLeft.x + 15 * scale + dx, y: topLeft.y + 4 * scale + dy }, 'stone', stoneCfg);
      }
    }

    // Житло (справа внизу) - меблі (масштабовані)
    for (let dx = 0; dx < scale * 2; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 12 * scale + dx, y: topLeft.y + 10 * scale + dy }, 'stone', stoneCfg);
      }
    }
    for (let dx = 0; dx < scale; dx++) {
      for (let dy = 0; dy < scale; dy++) {
        this.setTileIfEmpty({ x: topLeft.x + 15 * scale + dx, y: topLeft.y + 11 * scale + dy }, 'stone', stoneCfg);
      }
    }
  }

  // ✅ Допоміжні методи
  private drawRect(topLeft: GridPoint, width: number, height: number, tileId: string, config: TileConfig) {
    // Верхня стіна
    for (let x = topLeft.x; x < topLeft.x + width; x++) {
      const p = { x, y: topLeft.y };
      if (this.inBounds(p)) this.setTileType(p, tileId, config);
    }
    // Нижня стіна
    for (let x = topLeft.x; x < topLeft.x + width; x++) {
      const p = { x, y: topLeft.y + height - 1 };
      if (this.inBounds(p)) this.setTileType(p, tileId, config);
    }
    // Ліва стіна
    for (let y = topLeft.y; y < topLeft.y + height; y++) {
      const p = { x: topLeft.x, y };
      if (this.inBounds(p)) this.setTileType(p, tileId, config);
    }
    // Права стіна
    for (let y = topLeft.y; y < topLeft.y + height; y++) {
      const p = { x: topLeft.x + width - 1, y };
      if (this.inBounds(p)) this.setTileType(p, tileId, config);
    }
  }

  private clearTile(p: GridPoint) {
    if (this.inBounds(p)) {
      this.tileTypes.delete(this.idx(p));
      this.setBlocked(p, false);
    }
  }

  private setTileIfEmpty(p: GridPoint, tileId: string, config: TileConfig) {
    if (this.inBounds(p) && !this.tileTypes.has(this.idx(p))) {
      this.setTileType(p, tileId, config);
    }
  }
}
