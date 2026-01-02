// src/game/assets/AssetManifest.ts
import { calculateCharacterParams, type CharacterConfig, ANIMATION_SPEED_CONSTANTS } from '../config/characterConfig';

/**
 * Конфігурація персонажів
 * 
 * Задаємо ТІЛЬКИ варіативні параметри:
 * - walkFrameCount: кількість кадрів walk анімації
 * - idleFrameCount: кількість кадрів idle анімації
 * - baseScale: базовий розмір (може змінюватись для кожного персонажа)
 * 
 * Решта (FPS, moveSpeed) розраховується АВТОМАТИЧНО!
 */
const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
  hero: {
    key: "hero",
    url: "/sprites/capguy-walk-1472.png",
    frameW: 184,
    frameH: 325,
    walkFrameCount: 8,  // Стандартний spritesheet має 8 кадрів
    idleFrameCount: 1,  // Один кадр для idle
    baseScale: 0.8,     // Базовий розмір
    visualSize: 2.0,    // ✅ Зменшено в 2 рази (0.8 × 2 = 1.6)
  },
  cyberpunkMarsian: {
    key: "cyberpunk-marsian",
    frameW: 96,
    frameH: 96,
    walkFrameCount: 6,  // 6 кадрів walk анімації
    idleFrameCount: 4,  // 4 кадри breathing-idle
    baseScale: 2.0,     // Базовий розмір
    visualSize: 2.0,    // ✅ Зменшено в 2 рази (2.0 × 2 = 4.0)
    directions: ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"],
  },
  warrior: {
    key: "warrior",
    frameW: 128,
    frameH: 128,
    walkFrameCount: 15,  // 15 кадрів walk анімації
    idleFrameCount: 15,  // 15 кадрів idle анімації
    runFrameCount: 15,   // ✅ 15 кадрів run анімації
    turnFrameCount: 15,  // ✅ 15 кадрів turn анімації (180Turn)
    castFrameCount: 15,  // ✅ 15 кадрів cast spell анімації
    kickFrameCount: 15,  // ✅ 15 кадрів kick анімації
    meleeFrameCount: 15, // ✅ 15 кадрів melee attack анімації
    // ✅ Додаткові анімації
    dieFrameCount: 15,        // ✅ 15 кадрів die (смерть)
    damageFrameCount: 15,     // ✅ 15 кадрів take damage
    shieldBlockFrameCount: 15, // ✅ 15 кадрів shield block
    melee2FrameCount: 15,     // ✅ 15 кадрів melee 2
    meleeSpinFrameCount: 15,  // ✅ 15 кадрів melee spin
    special1FrameCount: 15,   // ✅ 15 кадрів special attack 1
    special2FrameCount: 15,   // ✅ 15 кадрів special attack 2
    rollFrameCount: 15,       // ✅ 15 кадрів roll
    baseScale: 1.5,      // Базовий розмір
    visualSize: 1.0,     // Зменшено в 2 рази (було 2.0, тепер 1.0)
    animationSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.WALK_ANIMATION_MULTIPLIER,  // ✅ 36 FPS (стандарт)
    actionSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.ACTION_ANIMATION_MULTIPLIER,     // ✅ 30 FPS (стандарт)
    runSpeedMultiplier: 2.0,  // ✅ Біг в 2 рази швидше за ходьбу
    // ✅ ПРАВИЛЬНИЙ ПОРЯДОК після перейменування папок
    directions: ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"],
  },
};

/**
 * Розраховані конфігурації персонажів
 * 
 * Всі параметри (FPS, moveSpeed, scale) обчислені автоматично
 * на основі формул синхронізації!
 */
export const SPRITES = Object.fromEntries(
  Object.entries(CHARACTER_CONFIGS).map(([id, config]) => {
    const fullConfig = calculateCharacterParams(config);
    
    // ⏱️ ВИМКНЕНО ДЛЯ ШВИДКОСТІ
    // logCharacterSync(id, fullConfig);
    
    return [id, fullConfig];
  })
) as Record<string, Required<CharacterConfig>>;

export type SpriteId = keyof typeof SPRITES;

/**
 * Експортуємо також базові конфігурації для редагування
 */
export const RAW_CHARACTER_CONFIGS = CHARACTER_CONFIGS;
