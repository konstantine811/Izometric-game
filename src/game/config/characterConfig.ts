// src/game/config/characterConfig.ts

/**
 * Базові константи для розрахунку параметрів персонажів
 * 
 * Базується на рекомендаціях для ізометричних ігор:
 * - Walk cycle: 0.5-0.8 сек для плавності
 * - Idle cycle: 1-3 сек
 * - Target FPS: 30-60
 */
export const CHARACTER_BASE_CONFIG = {
  // Базова швидкість руху (мс на клітинку)
  BASE_MOVE_SPEED: 200,
  
  // Рекомендований час для walk cycle (мс)
  WALK_CYCLE_DURATION: 600, // 0.6 сек - золота середина для плавності
  
  // Співвідношення idle FPS до walk FPS
  IDLE_TO_WALK_FPS_RATIO: 0.5, // Idle вдвічі повільніший
  
  // Мінімальний та максимальний FPS
  MIN_FPS: 8,
  MAX_FPS: 60, // ✅ Збільшено для швидших анімацій
} as const;

/**
 * ✅ КОНСТАНТИ ШВИДКОСТІ АНІМАЦІЙ
 * 
 * Стандартні множники для всіх персонажів
 * Використовуй ці значення для нових персонажів!
 */
export const ANIMATION_SPEED_CONSTANTS = {
  // ✅ Базові анімації (walk, idle, run)
  // Множник для walk/idle/run анімацій
  // Результат: 25 FPS × 1.44 = 36 FPS
  WALK_ANIMATION_MULTIPLIER: 1.44,
  
  // ✅ Action анімації (cast, kick, melee, roll, etc.)
  // Множник для action анімацій (відносно базового FPS)
  // Результат: 25 FPS × 1.2 = 30 FPS
  ACTION_ANIMATION_MULTIPLIER: 1.2,
  
  // ✅ Співвідношення action до walk
  // actionSpeedMultiplier / animationSpeedMultiplier = 1.2 / 1.44 = 0.833
  // Action анімації на ~17% повільніші за walk
  ACTION_TO_WALK_RATIO: 0.833, // 1.2 / 1.44
  
  // ✅ Розрахунок FPS (для 15 кадрів):
  // Базовий FPS = 25 (15 кадрів / 0.6 сек)
  // Walk FPS = 25 × 1.44 = 36 FPS
  // Action FPS = 25 × 1.2 = 30 FPS
} as const;

/**
 * Інтерфейс конфігурації персонажа
 */
export interface CharacterConfig {
  // Обов'язкові параметри
  key: string;
  frameW: number;
  frameH: number;
  spriteSourceKey?: string;  // 🧪 Для клонів: використовувати файли іншого персонажа
  
  // Варіативні параметри (різні для кожного персонажа)
  walkFrameCount: number;    // Кількість кадрів walk анімації
  idleFrameCount: number;    // Кількість кадрів idle анімації
  runFrameCount?: number;    // ✅ Кількість кадрів run анімації (опціонально)
  turnFrameCount?: number;   // ✅ Кількість кадрів turn анімації (180 turn)
  castFrameCount?: number;   // ✅ Кількість кадрів cast spell анімації
  kickFrameCount?: number;   // ✅ Кількість кадрів kick анімації
  meleeFrameCount?: number;  // ✅ Кількість кадрів melee attack анімації
  // ✅ Додаткові анімації
  dieFrameCount?: number;        // ✅ Кількість кадрів die (смерть)
  damageFrameCount?: number;     // ✅ Кількість кадрів take damage
  shieldBlockFrameCount?: number; // ✅ Кількість кадрів shield block
  melee2FrameCount?: number;     // ✅ Кількість кадрів melee 2
  meleeSpinFrameCount?: number;  // ✅ Кількість кадрів melee spin
  special1FrameCount?: number;   // ✅ Кількість кадрів special 1
  special2FrameCount?: number;   // ✅ Кількість кадрів special 2
  rollFrameCount?: number;       // ✅ Кількість кадрів roll
  baseScale: number;         // Базовий розмір спрайту
  visualSize: number;        // ✅ Візуальний розмір персонажа (унікальний!)
  animationSpeedMultiplier?: number; // ✅ Множник швидкості walk/idle анімації (1.0 = нормально, 2.0 = вдвічі швидше)
  actionSpeedMultiplier?: number;    // ✅ Множник швидкості action анімацій (cast, kick, melee, roll, etc.)
  movementSpeedMultiplier?: number;  // ✅ Множник швидкості руху (1.0 = нормально, 1.5 = в 1.5 рази швидше)
  runSpeedMultiplier?: number;       // ✅ Множник швидкості бігу (наприклад, 1.8 = на 80% швидше за walk)
  
  // Опціональні (для старих спрайтшитів)
  url?: string;
  directions?: readonly string[];
  
  // Розраховані параметри (додаються автоматично)
  scale?: number;
  walkFPS?: number;
  idleFPS?: number;
  runFPS?: number;
  turnFPS?: number;    // ✅ FPS для turn анімації
  castFPS?: number;    // ✅ FPS для cast spell анімації
  kickFPS?: number;    // ✅ FPS для kick анімації
  meleeFPS?: number;   // ✅ FPS для melee attack анімації
  // ✅ FPS для додаткових анімацій
  dieFPS?: number;        // ✅ FPS для die
  damageFPS?: number;     // ✅ FPS для damage
  shieldBlockFPS?: number; // ✅ FPS для shield block
  melee2FPS?: number;     // ✅ FPS для melee 2
  meleeSpinFPS?: number;  // ✅ FPS для melee spin
  special1FPS?: number;   // ✅ FPS для special 1
  special2FPS?: number;   // ✅ FPS для special 2
  rollFPS?: number;       // ✅ FPS для roll
  moveSpeed?: number;
}

/**
 * Формули для розрахунку параметрів анімації
 */
export class CharacterAnimationCalculator {
  /**
   * Розрахунок оптимального FPS для walk анімації
   * 
   * Базується на рекомендації: Walk cycle = 0.5-0.8 сек для плавності
   * Формула: FPS = frameCount / cycleDuration
   * 
   * Приклад:
   * - 15 кадрів / 0.6 сек = 25 FPS (дуже плавно!)
   * - 8 кадрів / 0.6 сек = 13 FPS
   * - 6 кадрів / 0.6 сек = 10 FPS
   * 
   * @param walkFrameCount - кількість кадрів walk анімації
   * @returns оптимальний FPS
   */
  static calculateWalkFPS(
    walkFrameCount: number
  ): number {
    // Тривалість циклу в секундах
    const cycleDuration = CHARACTER_BASE_CONFIG.WALK_CYCLE_DURATION / 1000;
    const fps = walkFrameCount / cycleDuration;
    
    // Обмежуємо FPS в розумних межах
    return Math.max(
      CHARACTER_BASE_CONFIG.MIN_FPS,
      Math.min(CHARACTER_BASE_CONFIG.MAX_FPS, Math.round(fps))
    );
  }
  
  /**
   * Розрахунок оптимального FPS для idle анімації
   * 
   * Idle зазвичай повільніший за walk
   * 
   * @param idleFrameCount - кількість кадрів idle анімації
   * @param walkFPS - FPS walk анімації (для співвідношення)
   * @returns оптимальний FPS для idle
   */
  static calculateIdleFPS(
    idleFrameCount: number,
    walkFPS: number
  ): number {
    // Idle повинен бути повільнішим за walk
    const targetFPS = walkFPS * CHARACTER_BASE_CONFIG.IDLE_TO_WALK_FPS_RATIO;
    
    // Але не менше певного мінімуму для плавності
    const minIdleFPS = Math.max(4, idleFrameCount / 3); // Мінімум 3 секунди на цикл
    
    return Math.max(
      minIdleFPS,
      Math.min(CHARACTER_BASE_CONFIG.MAX_FPS, Math.round(targetFPS))
    );
  }
  
  /**
   * Розрахунок moveSpeed для синхронізації з анімацією
   * 
   * Повертає базову швидкість руху
   * 
   * @returns базовий moveSpeed (мс на клітинку)
   */
  static calculateMoveSpeed(): number {
    return CHARACTER_BASE_CONFIG.BASE_MOVE_SPEED; // Використовуємо базову швидкість
  }
  
  /**
   * Перевірка синхронізації анімації та руху
   * 
   * Рекомендації для плавності:
   * - Walk cycle: 0.5-0.8 сек (оптимально 0.6 сек)
   * - Кількість кроків: 2-4 за цикл
   * 
   * @param walkFrameCount - кількість кадрів
   * @param walkFPS - FPS анімації
   * @param moveSpeed - швидкість руху
   * @returns об'єкт з інформацією про синхронізацію
   */
  static validateSync(
    walkFrameCount: number,
    walkFPS: number,
    moveSpeed: number
  ): {
    animationDuration: number;
    stepsPerCycle: number;
    isWellSynced: boolean;
    recommendation: string;
  } {
    const animationDuration = walkFrameCount / walkFPS; // секунди
    const stepsPerCycle = (animationDuration * 1000) / moveSpeed;
    
    // Оптимально: цикл 0.5-0.8 сек, 2-4 кроки
    const isOptimalDuration = animationDuration >= 0.5 && animationDuration <= 0.8;
    const isOptimalSteps = stepsPerCycle >= 2 && stepsPerCycle <= 4;
    const isWellSynced = isOptimalDuration && isOptimalSteps;
    
    let recommendation = '';
    if (animationDuration < 0.5) {
      recommendation = `⚡ Цикл занадто швидкий (${animationDuration.toFixed(2)}s). Рекомендація: 0.5-0.8s`;
    } else if (animationDuration > 0.8) {
      recommendation = `🐌 Цикл занадто повільний (${animationDuration.toFixed(2)}s). Рекомендація: 0.5-0.8s`;
    } else if (!isOptimalSteps) {
      recommendation = `🔄 Цикл OK, але ${stepsPerCycle.toFixed(1)} кроків (рекомендовано 2-4)`;
    } else {
      recommendation = '✅ Відмінна синхронізація та плавність!';
    }
    
    return {
      animationDuration,
      stepsPerCycle,
      isWellSynced,
      recommendation,
    };
  }
}

/**
 * Обчислення всіх параметрів для персонажа
 * 
 * Базується на рекомендаціях:
 * - Walk cycle: 0.6 сек (для максимальної плавності)
 * - Кількість кроків: 3 за цикл (600ms / 200ms)
 * - FPS розраховується автоматично для плавності
 * 
 * Приклади:
 * - 15 кадрів → 25 FPS (15 / 0.6)
 * - 8 кадрів → 13 FPS (8 / 0.6)
 * - 6 кадрів → 10 FPS (6 / 0.6)
 * 
 * @param config - базова конфігурація
 * @returns повна конфігурація з розрахованими параметрами
 */
export function calculateCharacterParams(
  config: CharacterConfig
): Required<CharacterConfig> {
  // Розраховуємо оптимальний FPS для walk (базується на WALK_CYCLE_DURATION)
  let walkFPS = CharacterAnimationCalculator.calculateWalkFPS(
    config.walkFrameCount
  );
  
  // ✅ Застосовуємо множник швидкості анімації walk/idle (якщо є)
  const speedMultiplier = config.animationSpeedMultiplier ?? 1.0;
  walkFPS = Math.round(walkFPS * speedMultiplier);
  
  // Розраховуємо FPS для idle (вдвічі повільніший за walk)
  let idleFPS = CharacterAnimationCalculator.calculateIdleFPS(
    config.idleFrameCount,
    walkFPS
  );
  idleFPS = Math.round(idleFPS * speedMultiplier);
  
  // ✅ Розраховуємо FPS для run (якщо є)
  let runFPS = config.runFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.runFrameCount) * speedMultiplier)
    : walkFPS;
  
  // ✅ Застосовуємо множник швидкості для action анімацій (якщо є, інакше = speedMultiplier)
  const actionMultiplier = config.actionSpeedMultiplier ?? speedMultiplier;
  
  // ✅ Розраховуємо FPS для action анімацій (turn, cast, kick, melee)
  // Використовуємо actionMultiplier для сповільнення action анімацій
  let turnFPS = config.turnFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.turnFrameCount) * actionMultiplier)
    : walkFPS;
  
  let castFPS = config.castFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.castFrameCount) * actionMultiplier)
    : walkFPS;
  
  let kickFPS = config.kickFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.kickFrameCount) * actionMultiplier)
    : walkFPS;
  
  let meleeFPS = config.meleeFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.meleeFrameCount) * actionMultiplier)
    : walkFPS;
  
  // ✅ Розраховуємо FPS для додаткових action анімацій (використовуємо actionMultiplier!)
  let dieFPS = config.dieFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.dieFrameCount) * actionMultiplier)
    : walkFPS;
  
  let damageFPS = config.damageFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.damageFrameCount) * actionMultiplier)
    : walkFPS;
  
  let shieldBlockFPS = config.shieldBlockFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.shieldBlockFrameCount) * actionMultiplier)
    : walkFPS;
  
  let melee2FPS = config.melee2FrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.melee2FrameCount) * actionMultiplier)
    : walkFPS;
  
  let meleeSpinFPS = config.meleeSpinFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.meleeSpinFrameCount) * actionMultiplier)
    : walkFPS;
  
  let special1FPS = config.special1FrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.special1FrameCount) * actionMultiplier)
    : walkFPS;
  
  let special2FPS = config.special2FrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.special2FrameCount) * actionMultiplier)
    : walkFPS;
  
  let rollFPS = config.rollFrameCount
    ? Math.round(CharacterAnimationCalculator.calculateWalkFPS(config.rollFrameCount) * actionMultiplier)
    : walkFPS;
  
  // Обмежуємо FPS в розумних межах
  walkFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, walkFPS));
  idleFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, idleFPS));
  runFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, runFPS));
  turnFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, turnFPS));
  castFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, castFPS));
  kickFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, kickFPS));
  meleeFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, meleeFPS));
  dieFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, dieFPS));
  damageFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, damageFPS));
  shieldBlockFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, shieldBlockFPS));
  melee2FPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, melee2FPS));
  meleeSpinFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, meleeSpinFPS));
  special1FPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, special1FPS));
  special2FPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, special2FPS));
  rollFPS = Math.max(CHARACTER_BASE_CONFIG.MIN_FPS, Math.min(60, rollFPS));
  
  // ✅ Застосовуємо множник швидкості руху (якщо є)
  const movementMultiplier = config.movementSpeedMultiplier ?? 1.0;
  const moveSpeed = Math.round(CHARACTER_BASE_CONFIG.BASE_MOVE_SPEED / movementMultiplier);
  // Приклад: 200ms / 1.5 = 133ms (швидше в 1.5 рази)
  
  // ✅ Розраховуємо фінальний scale на основі baseScale та visualSize
  const scale = config.baseScale * config.visualSize;
  
  // Повертаємо повну конфігурацію
  return {
    ...config,
    animationSpeedMultiplier: speedMultiplier,
    actionSpeedMultiplier: actionMultiplier,
    movementSpeedMultiplier: movementMultiplier,
    runSpeedMultiplier: config.runSpeedMultiplier ?? 1.0,
    spriteSourceKey: config.spriteSourceKey || '',
    scale,
    walkFPS,
    idleFPS,
    runFPS,
    turnFPS,
    castFPS,
    kickFPS,
    meleeFPS,
    // ✅ Додаткові FPS
    dieFPS,
    damageFPS,
    shieldBlockFPS,
    melee2FPS,
    meleeSpinFPS,
    special1FPS,
    special2FPS,
    rollFPS,
    moveSpeed,
    url: config.url || '',
    directions: config.directions || [],
    runFrameCount: config.runFrameCount || 0,
    turnFrameCount: config.turnFrameCount || 0,
    castFrameCount: config.castFrameCount || 0,
    kickFrameCount: config.kickFrameCount || 0,
    meleeFrameCount: config.meleeFrameCount || 0,
    // ✅ Додаткові frame counts
    dieFrameCount: config.dieFrameCount || 0,
    damageFrameCount: config.damageFrameCount || 0,
    shieldBlockFrameCount: config.shieldBlockFrameCount || 0,
    melee2FrameCount: config.melee2FrameCount || 0,
    meleeSpinFrameCount: config.meleeSpinFrameCount || 0,
    special1FrameCount: config.special1FrameCount || 0,
    special2FrameCount: config.special2FrameCount || 0,
    rollFrameCount: config.rollFrameCount || 0,
  };
}

/**
 * Виведення звіту про синхронізацію персонажа
 */
export function logCharacterSync(
  characterKey: string,
  config: Required<CharacterConfig>
): void {
  const sync = CharacterAnimationCalculator.validateSync(
    config.walkFrameCount,
    config.walkFPS,
    config.moveSpeed
  );
  
  console.log(`\n=== ${characterKey} Animation Sync ===`);
  console.log(`Walk: ${config.walkFrameCount} frames @ ${config.walkFPS} FPS`);
  console.log(`Idle: ${config.idleFrameCount} frames @ ${config.idleFPS} FPS`);
  if (config.animationSpeedMultiplier !== 1.0) {
    console.log(`Animation Speed: ${config.animationSpeedMultiplier}× ⚡`);
  }
  console.log(`Move Speed: ${config.moveSpeed}ms per cell`);
  if (config.movementSpeedMultiplier !== 1.0) {
    console.log(`Movement Speed: ${config.movementSpeedMultiplier}× 🏃`);
  }
  console.log(`Visual Size: ${config.visualSize}× (base: ${config.baseScale})`);
  console.log(`Final Scale: ${config.scale} (${config.baseScale} × ${config.visualSize})`);
  console.log(`Animation Duration: ${sync.animationDuration.toFixed(2)}s`);
  console.log(`Steps per Cycle: ${sync.stepsPerCycle.toFixed(2)}`);
  console.log(`Status: ${sync.isWellSynced ? '✅' : '⚠️'} ${sync.recommendation}`);
  console.log('============================\n');
}

