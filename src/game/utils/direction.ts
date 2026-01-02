import type { GridPoint } from "../types/grid-types";

export type Direction8 = "south" | "south-east" | "east" | "north-east" | "north" | "north-west" | "west" | "south-west";

/**
 * Визначає напрямок руху між двома клітинками (8 напрямків)
 * Враховує ізометричну проекцію
 */
export function getDirection8(from: GridPoint, to: GridPoint): Direction8 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Для ізометричної проекції потрібно трансформувати координати
  // В ізометрії: +X йде вправо-вниз, +Y йде вліво-вниз
  // Конвертуємо в екранні координати для правильного визначення напрямку
  const isoX = dx - dy; // Ізометрична X (схід-захід на екрані)
  const isoY = dx + dy; // Ізометрична Y (північ-південь на екрані)

  // Визначаємо напрямок на основі ізометричних координат
  const angle = Math.atan2(isoY, isoX);
  const degrees = angle * (180 / Math.PI);
  const normalized = (degrees + 360) % 360;
  
  // Розподіляємо кути на 8 секторів
  // 0° = схід (right), 90° = південь (down), 180° = захід (left), 270° = північ (up)
  if (normalized >= 337.5 || normalized < 22.5) return "east";
  if (normalized >= 22.5 && normalized < 67.5) return "south-east";
  if (normalized >= 67.5 && normalized < 112.5) return "south";
  if (normalized >= 112.5 && normalized < 157.5) return "south-west";
  if (normalized >= 157.5 && normalized < 202.5) return "west";
  if (normalized >= 202.5 && normalized < 247.5) return "north-west";
  if (normalized >= 247.5 && normalized < 292.5) return "north";
  if (normalized >= 292.5 && normalized < 337.5) return "north-east";
  
  return "south"; // fallback
}

/**
 * Перевіряє чи має персонаж 8-напрямкові анімації
 */
export function hasDirectionalAnims(spriteConfig: any): boolean {
  return "directions" in spriteConfig && Array.isArray(spriteConfig.directions);
}

/**
 * Перевіряє чи рух діагональний
 * Діагональний рух = зміна по обох осях одночасно
 * 
 * @param from - початкова клітинка
 * @param to - цільова клітинка
 * @returns true якщо рух діагональний
 */
export function isDiagonalMove(from: GridPoint, to: GridPoint): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return dx > 0 && dy > 0;
}

/**
 * Розраховує дистанцію між клітинками
 * Враховує що діагональний рух довший (√2 ≈ 1.414)
 * 
 * @param from - початкова клітинка
 * @param to - цільова клітинка
 * @returns дистанція (1 для осьового руху, √2 для діагонального)
 */
export function calculateDistance(from: GridPoint, to: GridPoint): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  
  // Якщо рух тільки по одній осі - дистанція = 1
  if (dx === 0 || dy === 0) {
    return Math.max(dx, dy);
  }
  
  // Діагональний рух - дистанція = √2
  return Math.sqrt(dx * dx + dy * dy);
}

