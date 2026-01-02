// src/game/controllers/PlayerController.ts
import Phaser from "phaser";
import { Grid } from "../world/Grid";
import { IsoCharacter } from "../entities/IsoCharacter";
import type { GridPoint } from "../types/grid-types";
import type { IsoTransform } from "../iso/isoTransofrm";
import { clamp } from "../config/config";
import { astar } from "../utils/astar";
import type { TileEditor } from "../ui/TileEditor";
import type { SpriteId } from "../assets/AssetManifest";

export class PlayerController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private changeCharKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша для зміни персонажа
  private shiftKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша для бігу
  private turnKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша для повороту (T)
  private castKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша для каста spell (E)
  private kickKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша для kick (K)
  private meleeKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша для melee (Q)
  // ✅ Додаткові action клавіші
  private dieKey!: Phaser.Input.Keyboard.Key;        // X - Die
  private damageKey!: Phaser.Input.Keyboard.Key;     // Z - Damage
  private shieldKey!: Phaser.Input.Keyboard.Key;     // B - Shield Block
  private melee2Key!: Phaser.Input.Keyboard.Key;     // R - Melee 2
  private meleeSpinKey!: Phaser.Input.Keyboard.Key;  // F - Melee Spin
  private special1Key!: Phaser.Input.Keyboard.Key;   // Digit1 - Special 1
  private special2Key!: Phaser.Input.Keyboard.Key;   // Digit2 - Special 2
  private rollKey!: Phaser.Input.Keyboard.Key;       // V - Roll
  private path: GridPoint[] = [];
  private tileEditor?: TileEditor; // ✅ Посилання на редактор для перевірки режиму редагування
  private availableCharacters: SpriteId[] = ["hero", "cyberpunkMarsian", "warrior"];
  private currentCharIndex = 2; // ✅ Початковий індекс (warrior)

  public scene: Phaser.Scene;
  public grid: Grid;
  public iso: IsoTransform;
  public player: IsoCharacter;

  constructor(
    scene: Phaser.Scene,
    grid: Grid,
    iso: IsoTransform,
    player: IsoCharacter,
    tileEditor?: TileEditor
  ) {
    this.scene = scene;
    this.grid = grid;
    this.iso = iso;
    this.player = player;
    this.tileEditor = tileEditor;

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys("W,A,S,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.changeCharKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.C
    );
    this.shiftKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT
    );
    this.turnKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.T
    );
    this.castKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.kickKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.K
    );
    this.meleeKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Q
    );
    // ✅ Ініціалізація додаткових action клавіш
    this.dieKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.damageKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.shieldKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.melee2Key = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.meleeSpinKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.special1Key = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.special2Key = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.rollKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      // ✅ Перевіряємо, чи не активний режим редагування
      if (this.tileEditor?.isEditMode()) {
        return; // Не обробляємо клік для руху, якщо редагуємо тайли
      }

      // ✅ Не обробляємо клік під час action або руху
      if (this.player.isPerforming || this.player.isTurning || this.player.isMoving) {
        return;
      }

      const wp = p.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
      const cell = iso.screenToCell(wp.x, wp.y);
      if (!cell) return;
      if (grid.isBlocked(cell)) return;

      // ✅ ВИПРАВЛЕНО: Використовуємо this.player замість player з замикання!
      const route = astar(this.player.cell, cell, {
        cols: grid.cols,
        rows: grid.rows,
        isBlocked: (pt) => grid.isBlocked(pt),
        diagonal: true,
      });

      this.path = route.length > 1 ? route.slice(1) : [];
    });
  }

  switchCharacter() {
    // ✅ Зберігаємо поточну позицію
    const currentCell = { ...this.player.cell };
    
    // ✅ Знищуємо старого персонажа
    this.player.destroy();
    
    // ✅ Переключаємо на наступного персонажа
    this.currentCharIndex = (this.currentCharIndex + 1) % this.availableCharacters.length;
    const newCharId = this.availableCharacters[this.currentCharIndex];
    
    // ✅ Створюємо нового персонажа на тій же позиції
    this.player = new IsoCharacter(this.scene, this.iso, newCharId, currentCell);
    
    // ✅ Оновлюємо камеру для слідкування за новим персонажем
    this.scene.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    
    // Людські назви для консолі
    const characterNames: Record<string, string> = {
      'hero': 'Hero',
      'cyberpunkMarsian': 'Cyberpunk Marsian',
      'warrior': 'Warrior',
    };
    
    console.log(`Switched to character: ${characterNames[newCharId] || newCharId}`);
  }

  /**
   * ✅ Зупиняє рух персонажа одразу (для action анімацій)
   */
  private stopMovement() {
    // Очищаємо шлях
    this.path = [];
    
    // Зупиняємо всі tweens руху
    this.scene.tweens.killTweensOf(this.player.sprite);
    
    // Скидаємо флаг руху
    this.player.moving = false;
    this.player.running = false;
    
    // Оновлюємо позицію персонажа до найближчої клітинки
    const screenX = this.player.sprite.x;
    const screenY = this.player.sprite.y + 2; // Компенсуємо offset
    const nearestCell = this.iso.screenToCell(screenX, screenY);
    
    if (nearestCell && !this.grid.isBlocked(nearestCell)) {
      this.player.cell = nearestCell;
      // Вирівнюємо позицію спрайту до центру клітинки
      const { x, y } = this.iso.cellToScreen(nearestCell);
      this.player.sprite.setPosition(x, y - 2);
    }
  }

  /**
   * ✅ Допоміжний метод для обробки action клавіш
   */
  private handleActionKey(
    key: Phaser.Input.Keyboard.Key,
    action: () => void
  ): boolean {
    if (
      Phaser.Input.Keyboard.JustDown(key) &&
      !this.player.isTurning &&
      !this.player.isPerforming
    ) {
      this.stopMovement();
      action();
      return true;
    }
    return false;
  }

  update() {
    // ✅ Обробка зміни персонажа (клавіша C)
    if (
      Phaser.Input.Keyboard.JustDown(this.changeCharKey) &&
      !this.player.isMoving &&
      !this.player.isTurning &&
      !this.player.isPerforming
    ) {
      this.switchCharacter();
      return;
    }
    
    // ✅ Обробка action клавіш (всі виконуються ОДРАЗУ, НЕ переривається!)
    if (this.handleActionKey(this.turnKey, () => this.player.playTurn())) return;
    if (this.handleActionKey(this.castKey, () => this.player.playCast())) return;
    if (this.handleActionKey(this.kickKey, () => this.player.playKick())) return;
    if (this.handleActionKey(this.meleeKey, () => this.player.playMelee())) return;
    
    // ✅ Додаткові action клавіші
    if (this.handleActionKey(this.dieKey, () => this.player.playDie())) return;
    if (this.handleActionKey(this.damageKey, () => this.player.playDamage())) return;
    if (this.handleActionKey(this.shieldKey, () => this.player.playShieldBlock())) return;
    if (this.handleActionKey(this.melee2Key, () => this.player.playMelee2())) return;
    if (this.handleActionKey(this.meleeSpinKey, () => this.player.playMeleeSpin())) return;
    if (this.handleActionKey(this.special1Key, () => this.player.playSpecial1())) return;
    if (this.handleActionKey(this.special2Key, () => this.player.playSpecial2())) return;
    if (this.handleActionKey(this.rollKey, () => this.player.playRoll())) return;

    // ✅ Обробка pathfinding (не під час action)
    if (!this.player.isMoving && !this.player.isPerforming && this.path.length) {
      const nextCell = this.path.shift()!;
      const hasMoreMoves = this.path.length > 0;
      // ✅ Перевіряємо чи натиснутий Shift для бігу по шляху
      const isRunning = this.shiftKey.isDown;
      this.player.moveTo(nextCell, undefined, hasMoreMoves, isRunning);
      return;
    }
    
    // ✅ Якщо шлях закінчився - перемикаємо на idle
    if (!this.player.isMoving && this.path.length === 0 && !this.player.isPerforming) {
      const currentAnim = this.player.sprite.anims.currentAnim?.key || '';
      if (currentAnim.includes('-walk-') || currentAnim.endsWith('-walk') || 
          currentAnim.includes('-run-') || currentAnim.endsWith('-run')) {
        this.player.playIdle();
      }
    }

    // ✅ Не обробляємо НОВИЙ рух якщо персонаж зайнятий
    if (this.player.isMoving || this.player.isTurning || this.player.isPerforming) return;

    const dx =
      (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) +
      (this.cursors.left.isDown || this.wasd.A.isDown ? -1 : 0);

    const dy =
      (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) +
      (this.cursors.up.isDown || this.wasd.W.isDown ? -1 : 0);

    // ✅ Якщо гравець не рухається і клавіші не натиснуті, перемикаємо на idle
    if (dx === 0 && dy === 0) {
      // Перевіряємо чи грає будь-яка walk анімація
      const currentAnim = this.player.sprite.anims.currentAnim?.key || '';
      if (currentAnim.includes('-walk-') || currentAnim.endsWith('-walk')) {
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

    // ✅ Перевіряємо чи натиснутий Shift для бігу
    const isRunning = this.shiftKey.isDown;

    this.player.moveTo(target, undefined, stillPressed, isRunning);
  }
}
