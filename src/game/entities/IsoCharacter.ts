import Phaser from "phaser";
import { SPRITES, type SpriteId } from "../assets/AssetManifest";
import { ensureCharacterAnims } from "../assets/AnimRegistry";
import type { GridPoint } from "../types/grid-types";
import type { IsoTransform } from "../iso/isoTransofrm";

export class IsoCharacter {
  sprite: Phaser.GameObjects.Sprite;
  cell: GridPoint;
  moving = false;
  moveSpeed = 80; // ✅ Швидкість руху по мапі (не впливає на анімацію)
  private idleTimer: Phaser.Time.TimerEvent | null = null; // ✅ Таймер для відкладеної перемкки на idle

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
    this.sprite.play(`${SPRITES[this.id].key}-idle`, true);
  }

  playWalk() {
    this.sprite.play(`${SPRITES[this.id].key}-walk`, true);
  }

  async moveTo(cell: GridPoint, duration?: number, hasMoreMoves = false) {
    if (this.moving) return;
    this.moving = true;

    // ✅ Запускаємо анімацію ходьби тільки якщо вона ще не грає
    if (
      !this.sprite.anims.isPlaying ||
      this.sprite.anims.currentAnim?.key !== `${SPRITES[this.id].key}-walk`
    ) {
      this.playWalk();
    }

    const { x, y } = this.iso.cellToScreen(cell);
    const targetY = y - 2;

    // ✅ Використовуємо moveSpeed за замовчуванням, або переданий duration
    const moveDuration = duration ?? this.moveSpeed;

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

    // ✅ Скасовуємо попередній таймер перемикання на idle
    if (this.idleTimer !== null) {
      this.idleTimer.destroy();
      this.idleTimer = null;
    }

    // ✅ Перемикаємо на idle тільки якщо немає більше рухів
    // Додаємо невелику затримку, щоб дати час на наступний рух (для клавіатури)
    if (!hasMoreMoves) {
      this.idleTimer = this.scene.time.delayedCall(30, () => {
        // Перевіряємо, чи не почався новий рух за цей час
        if (!this.moving) {
          const walkKey = `${SPRITES[this.id].key}-walk`;
          // Перевіряємо, чи анімація ходьби все ще грає
          if (this.sprite.anims.currentAnim?.key === walkKey) {
            this.playIdle();
          }
        }
        this.idleTimer = null;
      });
    }
  }

  destroy() {
    if (this.idleTimer !== null) {
      this.idleTimer.destroy();
      this.idleTimer = null;
    }
    this.sprite.destroy();
  }
}
