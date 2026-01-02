import Phaser from "phaser";
import { SPRITES, type SpriteId } from "../assets/AssetManifest";
import { ensureCharacterAnims } from "../assets/AnimRegistry";
import type { GridPoint } from "../types/grid-types";
import type { IsoTransform } from "../iso/isoTransofrm";
import { getDirection8, hasDirectionalAnims, calculateDistance, type Direction8 } from "../utils/direction";
import { calculateTurnPath, calculateTurnDuration } from "../utils/turnAnimation";

export class IsoCharacter {
  sprite: Phaser.GameObjects.Sprite;
  cell: GridPoint;
  moving = false;
  turning = false; // ✅ Новий флаг для повороту
  running = false; // ✅ Новий флаг для бігу
  performing = false; // ✅ Флаг для action анімацій (не можна переривати!)
  moveSpeed = 200; // Швидкість руху (може бути перевизначена з конфігурації)
  private currentDirection: Direction8 = "south";
  private lastMoveDirection: Direction8 | null = null; // ✅ Напрямок останнього руху

  public scene: Phaser.Scene;
  public iso: IsoTransform;
  public id: SpriteId;

  constructor(
    scene: Phaser.Scene,
    iso: IsoTransform,
    id: SpriteId,
    startCell: GridPoint
  ) {
    this.scene = scene;
    this.iso = iso;
    this.id = id;
    const def = SPRITES[id];
    ensureCharacterAnims(scene, id);

    this.sprite = scene.add.sprite(0, 0, def.key);
    this.sprite.setOrigin(0.5, 0.85);
    this.sprite.setScale(def.scale ?? 1);

    // Встановлюємо швидкість руху з конфігурації (якщо є)
    if ("moveSpeed" in def && typeof def.moveSpeed === "number") {
      this.moveSpeed = def.moveSpeed;
    }

    this.cell = startCell;
    this.place(startCell);
    this.playIdle();
  }

  place(cell: GridPoint) {
    const { x, y } = this.iso.cellToScreen(cell);
    this.sprite.setPosition(x, y - 2);
    this.cell = cell;
  }

  playIdle() {
    const spriteConfig = SPRITES[this.id];
    if (hasDirectionalAnims(spriteConfig)) {
      this.sprite.play(`${spriteConfig.key}-idle-${this.currentDirection}`, true);
    } else {
      this.sprite.play(`${spriteConfig.key}-idle`, true);
    }
  }

  playWalk() {
    const spriteConfig = SPRITES[this.id];
    const walkKey = hasDirectionalAnims(spriteConfig) 
      ? `${spriteConfig.key}-walk-${this.currentDirection}`
      : `${spriteConfig.key}-walk`;
    
    // Не перезапускаємо анімацію якщо вона вже грає
    if (this.sprite.anims.currentAnim?.key === walkKey && this.sprite.anims.isPlaying) {
      return;
    }
    
    this.sprite.play(walkKey, true);
  }

  /**
   * Програє анімацію бігу
   */
  playRun() {
    const spriteConfig = SPRITES[this.id];
    
    // Перевіряємо чи є run анімація
    if (!('runFrameCount' in spriteConfig)) {
      // Якщо немає run - використовуємо walk
      this.playWalk();
      return;
    }
    
    const runKey = hasDirectionalAnims(spriteConfig) 
      ? `${spriteConfig.key}-run-${this.currentDirection}`
      : `${spriteConfig.key}-run`;
    
    // Не перезапускаємо анімацію якщо вона вже грає
    if (this.sprite.anims.currentAnim?.key === runKey && this.sprite.anims.isPlaying) {
      return;
    }
    
    this.sprite.play(runKey, true);
  }

  /**
   * ✅ Плавний поворот персонажа в новий напрямок
   * Використовує turn анімацію якщо є, інакше - idle кадри
   */
  async turnTo(targetDirection: Direction8) {
    const spriteConfig = SPRITES[this.id];
    
    // Якщо немає напрямкових анімацій - не повертаємось
    if (!hasDirectionalAnims(spriteConfig)) {
      this.currentDirection = targetDirection;
      return;
    }
    
    // Якщо вже в потрібному напрямку - не повертаємось
    if (this.currentDirection === targetDirection) {
      return;
    }
    
    this.turning = true;
    
    // ✅ Якщо є turn анімація - використовуємо її!
    if ('turnFrameCount' in spriteConfig && spriteConfig.turnFrameCount > 0) {
      // Розраховуємо шлях повороту
      const turnPath = calculateTurnPath(this.currentDirection, targetDirection);
      const turnDuration = calculateTurnDuration(this.currentDirection, targetDirection);
      const stepDuration = turnPath.length > 1 ? turnDuration / (turnPath.length - 1) : 0;
      
      // Для кожного проміжного напрямку показуємо кадри з turn анімації
      for (let i = 0; i < turnPath.length; i++) {
        const direction = turnPath[i];
        
        // Використовуємо перші кадри turn анімації для плавності
        const turnKey = `${spriteConfig.key}-turn-${direction}`;
        
        // Зупиняємо поточну анімацію і показуємо перші кадри turn
        this.sprite.anims.stop();
        this.sprite.play(turnKey);
        this.sprite.anims.pause();
        
        // Показуємо один з перших кадрів (1-3) для плавності
        const frameIndex = Math.min(2, spriteConfig.turnFrameCount - 1);
        this.sprite.anims.setCurrentFrame(this.sprite.anims.currentAnim!.frames[frameIndex]);
        
        // Чекаємо перед наступним кадром (окрім останнього)
        if (i < turnPath.length - 1) {
          await new Promise<void>((resolve) => {
            this.scene.time.delayedCall(stepDuration, () => resolve());
          });
        }
      }
    } else {
      // ✅ Fallback - використовуємо idle кадри як раніше
      const turnPath = calculateTurnPath(this.currentDirection, targetDirection);
      const turnDuration = calculateTurnDuration(this.currentDirection, targetDirection);
      const stepDuration = turnPath.length > 1 ? turnDuration / (turnPath.length - 1) : 0;
      
      for (let i = 0; i < turnPath.length; i++) {
        const direction = turnPath[i];
        const idleKey = `${spriteConfig.key}-idle-${direction}`;
        
        this.sprite.anims.stop();
        this.sprite.play(idleKey);
        this.sprite.anims.pause();
        this.sprite.anims.setCurrentFrame(this.sprite.anims.currentAnim!.frames[0]);
        
        if (i < turnPath.length - 1) {
          await new Promise<void>((resolve) => {
            this.scene.time.delayedCall(stepDuration, () => resolve());
          });
        }
      }
    }
    
    // Оновлюємо поточний напрямок
    this.currentDirection = targetDirection;
    this.turning = false;
  }

  /**
   * ✅ Програє анімацію повороту на 180 градусів
   */
  async playTurn(): Promise<void> {
    if (this.performing) return;
    
    const spriteConfig = SPRITES[this.id];
    
    // Перевіряємо чи є turn анімація
    if (!('turnFrameCount' in spriteConfig) || !hasDirectionalAnims(spriteConfig)) {
      return;
    }
    
    this.performing = true; // ✅ Блокуємо інші action
    const turnKey = `${spriteConfig.key}-turn-${this.currentDirection}`;
    
    return new Promise<void>((resolve) => {
      this.sprite.play(turnKey);
      this.sprite.once('animationcomplete', () => {
        this.performing = false; // ✅ Розблоковуємо
        this.playIdle();
        resolve();
      });
    });
  }

  /**
   * ✅ Програє анімацію каста spell
   */
  async playCast(): Promise<void> {
    if (this.performing) return;
    
    const spriteConfig = SPRITES[this.id];
    
    // Перевіряємо чи є cast анімація
    if (!('castFrameCount' in spriteConfig) || !hasDirectionalAnims(spriteConfig)) {
      return;
    }
    
    this.performing = true; // ✅ Блокуємо інші action
    const castKey = `${spriteConfig.key}-cast-${this.currentDirection}`;
    
    return new Promise<void>((resolve) => {
      this.sprite.play(castKey);
      this.sprite.once('animationcomplete', () => {
        this.performing = false; // ✅ Розблоковуємо
        this.playIdle();
        resolve();
      });
    });
  }

  /**
   * ✅ Програє анімацію удару ногою
   */
  async playKick(): Promise<void> {
    if (this.performing) return; // ✅ Не переривати action!
    
    const spriteConfig = SPRITES[this.id];
    
    // Перевіряємо чи є kick анімація
    if (!('kickFrameCount' in spriteConfig) || !hasDirectionalAnims(spriteConfig)) {
      return;
    }
    
    this.performing = true; // ✅ Блокуємо інші action
    const kickKey = `${spriteConfig.key}-kick-${this.currentDirection}`;
    
    return new Promise<void>((resolve) => {
      this.sprite.play(kickKey);
      this.sprite.once('animationcomplete', () => {
        this.performing = false; // ✅ Розблоковуємо
        this.playIdle();
        resolve();
      });
    });
  }

  /**
   * ✅ Програє анімацію атаки мечем (melee)
   */
  async playMelee(): Promise<void> {
    return this.playActionAnimation('melee', 'meleeFrameCount');
  }

  /**
   * ✅ Універсальний метод для відтворення action анімацій
   */
  private async playActionAnimation(
    animationName: string,
    frameCountKey: string,
    returnToIdle: boolean = true
  ): Promise<void> {
    if (this.performing) {
      console.warn(`⚠️ [ACTION] ${animationName} blocked - already performing`);
      return;
    }
    
    const spriteConfig = SPRITES[this.id];
    
    // Перевіряємо чи є ця анімація
    if (!(frameCountKey in spriteConfig) || !hasDirectionalAnims(spriteConfig)) {
      console.warn(`❌ [ACTION] ${animationName} not found for ${this.id}`);
      console.warn(`  - frameCountKey: ${frameCountKey}`);
      console.warn(`  - Has key: ${frameCountKey in spriteConfig}`);
      console.warn(`  - Has directional anims: ${hasDirectionalAnims(spriteConfig)}`);
      return;
    }
    
    this.performing = true; // ✅ Блокуємо інші action
    const animKey = `${spriteConfig.key}-${animationName}-${this.currentDirection}`;
    
    console.log(`🎬 [ACTION] Playing ${animationName}`);
    console.log(`  - Animation key: ${animKey}`);
    
    // ✅ Перевіряємо чи існує анімація
    if (!this.scene.anims.exists(animKey)) {
      console.error(`❌ [ACTION] Animation key ${animKey} does not exist!`);
      console.error(`  - Check if animation was created in AnimRegistry`);
      this.performing = false; // ✅ Розблоковуємо!
      return;
    }
    
    return new Promise<void>((resolve) => {
      try {
        this.sprite.play(animKey);
        
        // ✅ Fallback timeout на випадок якщо animationcomplete не спрацює
        const safetyTimeout = this.scene.time.delayedCall(2000, () => {
          console.warn(`Animation ${animKey} timeout - forcing unlock`);
          this.performing = false;
          if (returnToIdle && animationName !== 'die') {
            this.playIdle();
          }
          resolve();
        });
        
        this.sprite.once('animationcomplete', () => {
          safetyTimeout.destroy(); // ✅ Відміняємо timeout
          this.performing = false; // ✅ Розблоковуємо
          if (returnToIdle && animationName !== 'die') {
            this.playIdle();
          }
          resolve();
        });
      } catch (error) {
        console.error(`Error playing animation ${animKey}:`, error);
        this.performing = false; // ✅ Розблоковуємо навіть при помилці!
        resolve();
      }
    });
  }

  // ✅ Додаткові action анімації
  async playDie(): Promise<void> {
    return this.playActionAnimation('die', 'dieFrameCount', false); // ✅ Не повертається до idle
  }

  async playDamage(): Promise<void> {
    return this.playActionAnimation('damage', 'damageFrameCount');
  }

  async playShieldBlock(): Promise<void> {
    return this.playActionAnimation('shield-block', 'shieldBlockFrameCount');
  }

  async playMelee2(): Promise<void> {
    return this.playActionAnimation('melee2', 'melee2FrameCount');
  }

  async playMeleeSpin(): Promise<void> {
    return this.playActionAnimation('melee-spin', 'meleeSpinFrameCount');
  }

  async playSpecial1(): Promise<void> {
    return this.playActionAnimation('special1', 'special1FrameCount');
  }

  async playSpecial2(): Promise<void> {
    return this.playActionAnimation('special2', 'special2FrameCount');
  }

  /**
   * ✅ Roll - перекат вперед з рухом (в напрямку останнього руху)
   */
  async playRoll(): Promise<void> {
    if (this.performing) return;
    
    const spriteConfig = SPRITES[this.id];
    
    // Перевіряємо чи є roll анімація
    if (!('rollFrameCount' in spriteConfig) || !hasDirectionalAnims(spriteConfig)) {
      return;
    }
    
    this.performing = true;
    this.moving = true; // ✅ Блокуємо рух
    
    // ✅ Використовуємо lastMoveDirection БЕЗ ВИПРАВЛЕНЬ!
    const direction = this.lastMoveDirection || this.currentDirection;
    const animKey = `${spriteConfig.key}-roll-${direction}`;
    
    // Перевіряємо чи існує анімація
    if (!this.scene.anims.exists(animKey)) {
      this.performing = false;
      this.moving = false;
      return;
    }
    
    // ✅ Запускаємо roll анімацію
    this.sprite.play(animKey);
    
    // ✅ Розраховуємо напрямок руху (вперед на 1 клітинку!)
    const directions: Record<Direction8, { dx: number; dy: number }> = {
      'east': { dx: 1, dy: 0 },
      'south-east': { dx: 1, dy: 1 },
      'south': { dx: 0, dy: 1 },
      'south-west': { dx: -1, dy: 1 },
      'west': { dx: -1, dy: 0 },
      'north-west': { dx: -1, dy: -1 },
      'north': { dx: 0, dy: -1 },
      'north-east': { dx: 1, dy: -1 },
    };
    
    const movement = directions[direction] || { dx: 0, dy: 2 };
    const targetCell = {
      x: Math.max(0, Math.min(this.cell.x + movement.dx, 999)), // Обмежуємо межами
      y: Math.max(0, Math.min(this.cell.y + movement.dy, 999)),
    };
    
    // ✅ Отримуємо екранні координати
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const { x: targetX, y } = this.iso.cellToScreen(targetCell);
    const targetY = y - 2;
    
    // ✅ Рухаємося паралельно з анімацією (лінійно, без діагоналі!)
    const rollDuration = (spriteConfig.rollFrameCount || 15) / (spriteConfig.rollFPS || 21) * 1000;
    
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    
    this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: rollDuration,
      ease: "Power2.easeOut",
      onUpdate: (tween) => {
        const progress = tween.getValue() as number;
        if (progress === null || progress === undefined) return;
        
        // ✅ Плавний рух по ізометричній сітці
        this.sprite.x = startX + deltaX * progress;
        this.sprite.y = startY + deltaY * progress;
      },
    });
    
    // ✅ Чекаємо завершення анімації
    return new Promise<void>((resolve) => {
      const safetyTimeout = this.scene.time.delayedCall(2000, () => {
        this.performing = false;
        this.moving = false;
        this.cell = targetCell;
        this.playIdle();
        resolve();
      });
      
      this.sprite.once('animationcomplete', () => {
        safetyTimeout.destroy();
        this.performing = false;
        this.moving = false;
        this.cell = targetCell;
        this.playIdle();
        resolve();
      });
    });
  }

  async moveTo(cell: GridPoint, duration?: number, hasMoreMoves = false, isRunning = false) {
    if (this.moving || this.turning) return;
    this.moving = true;
    this.running = isRunning;

    const spriteConfig = SPRITES[this.id];
    
      // ✅ Визначаємо новий напрямок руху
      if (hasDirectionalAnims(spriteConfig)) {
        const newDirection = getDirection8(this.cell, cell);
        const previousLastMove = this.lastMoveDirection; // Зберігаємо старе значення
        
        console.log('🔄 [MOVE] Direction change:');
        console.log('  - From cell:', this.cell);
        console.log('  - To cell:', cell);
        console.log('  - Current direction:', this.currentDirection);
        console.log('  - Last move direction:', this.lastMoveDirection);
        console.log('  - New direction:', newDirection);
        
        // ✅ Запам'ятовуємо напрямок руху (для roll)
        this.lastMoveDirection = newDirection;
        
        // 🔧 ВИПРАВЛЕННЯ: Не виконуємо поворот якщо вже рухаємось в правильному напрямку
        // Це запобігає зайвим поворотам при швидкому подвійному кліку
        // Якщо newDirection === previousLastMove, значить ми продовжуємо рух в тому ж напрямку
        const isContinuingSameDirection = newDirection === previousLastMove && previousLastMove !== null;
        
        // ✅ ПЛАВНИЙ ПОВОРОТ перед рухом (тільки якщо дійсно потрібно)
        if (newDirection !== this.currentDirection && !isContinuingSameDirection) {
          console.log('  - Turning from', this.currentDirection, 'to', newDirection);
          await this.turnTo(newDirection);
          console.log('  - After turn, currentDirection:', this.currentDirection);
        } else if (newDirection !== this.currentDirection && isContinuingSameDirection) {
          // Якщо напрямок змінився, але ми продовжуємо рух в тому ж напрямку - просто оновлюємо
          console.log('  - Continuing same direction, updating currentDirection without turn');
          this.currentDirection = newDirection;
        }
      }

    // ✅ Запускаємо анімацію (біг або ходьба)
    if (isRunning) {
      this.playRun();
    } else {
      this.playWalk();
    }

    const { x, y } = this.iso.cellToScreen(cell);
    const targetY = y - 2;

    // ✅ Розраховуємо дистанцію (враховуючи діагональ √2 ≈ 1.414)
    const distance = calculateDistance(this.cell, cell);
    
    // ✅ Застосовуємо runSpeedMultiplier якщо біжимо
    let effectiveMoveSpeed = this.moveSpeed;
    if (isRunning && 'runSpeedMultiplier' in spriteConfig && typeof spriteConfig.runSpeedMultiplier === 'number') {
      effectiveMoveSpeed = Math.round(this.moveSpeed / spriteConfig.runSpeedMultiplier);
    }
    
    // ✅ Використовуємо moveSpeed × дистанція, або переданий duration
    const moveDuration = duration ?? Math.round(effectiveMoveSpeed * distance);

    await new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite,
        x,
        y: targetY,
        duration: moveDuration,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });

    this.cell = cell;
    this.moving = false;
    this.running = false;

    // Перемикаємо на idle після завершення руху
    if (!hasMoreMoves) {
      this.playIdle();
    }
  }

  // ✅ Getters для стану персонажа
  get isMoving(): boolean {
    return this.moving;
  }

  get isTurning(): boolean {
    return this.turning;
  }

  get isPerforming(): boolean {
    return this.performing;
  }

  destroy() {
    this.sprite.destroy();
  }
}
