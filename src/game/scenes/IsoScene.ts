// src/game/scenes/IsoScene.ts
import Phaser from "phaser";
import { Grid } from "../world/Grid";
import { TileRenderer } from "../world/TileRenderer";
import { preloadSprites } from "../assets/AnimRegistry";
import { IsoCharacter } from "../entities/IsoCharacter";
import { PlayerController } from "../controllers/PlayerController";
import { IsoTransform } from "../iso/isoTransofrm";
import { GAME } from "../config/config";
import { TileEditor } from "../ui/TileEditor";
import { ControlsHint } from "../ui/ControlsHint"; // ✅ UI підказка
import { TILE_CONFIGS, TILES_BY_ID } from "../config/tiles";

export class IsoScene extends Phaser.Scene {
  private iso!: IsoTransform;
  private grid!: Grid;
  private tiles!: TileRenderer;
  public tileEditor!: TileEditor; // ✅ Редактор тайлів (публічний для доступу з React)

  private player!: IsoCharacter;
  private controller!: PlayerController;
  private infoText!: Phaser.GameObjects.Text; // ✅ Текст з інформацією про персонажа
  private controlsHint!: ControlsHint; // ✅ UI підказка з клавішами
  private toggleHintKey!: Phaser.Input.Keyboard.Key; // ✅ Клавіша H для показу/приховування

  constructor() {
    super("IsoScene");
  }

  preload() {
    console.log('🎮 [SCENE] Starting preload...');
    const preloadStart = performance.now();
    
    preloadSprites(this);

    // ✅ Завантажуємо зображення для тайлів, якщо вони вказані
    for (const tileConfig of TILE_CONFIGS) {
      if (tileConfig.imageUrl) {
        const key = `tile-${tileConfig.id}`;
        this.load.image(key, tileConfig.imageUrl);
      }
    }
    
    const preloadEnd = performance.now();
    const preloadTime = (preloadEnd - preloadStart).toFixed(2);
    console.log(`✅ [SCENE] Preload completed in ${preloadTime}ms`);
  }

  create() {
    console.log('🎮 [SCENE] Starting create...');
    const createStart = performance.now();
    
    this.cameras.main.setBackgroundColor("#0b0b0f");

    this.iso = new IsoTransform(GAME.tileW, GAME.tileH, GAME.cols, GAME.rows);
    this.iso.recalcOrigin(this.scale.width, this.scale.height);

    this.grid = new Grid(GAME.cols, GAME.rows);
    // ✅ Не встановлюємо демо-стіни, щоб не конфліктувати з редактором

    this.tiles = new TileRenderer(this, this.grid, this.iso);
    this.tiles.create();

    // ✅ Створюємо редактор тайлів
    this.tileEditor = new TileEditor(this, this.grid, this.iso, this.tiles);
    this.tileEditor.create();
    this.tileEditor.loadTiles(); // ✅ Завантажуємо збережені тайли

    // ✅ Якщо тайлів немає, створюємо локацію з будинками, рікою та дорогою
    if (this.grid.getTilesData().length === 0) {
      this.grid.createVillageLocation((tileId) => TILES_BY_ID.get(tileId));
      this.tiles.redraw();
    }

    this.player = new IsoCharacter(this, this.iso, "warrior", { x: 20 * 4, y: 25 * 4 });
    this.controller = new PlayerController(
      this,
      this.grid,
      this.iso,
      this.player,
      this.tileEditor // ✅ Передаємо редактор для перевірки режиму
    );

    // ✅ Створюємо інформаційний текст
    this.infoText = this.add.text(10, 10, "", {
      fontSize: "16px",
      color: "#00ff00",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    });
    this.infoText.setScrollFactor(0);
    this.infoText.setDepth(1000);
    this.updateInfoText();

    // ✅ Створюємо UI підказку з клавішами
    this.controlsHint = new ControlsHint(this);

    // ✅ Клавіша H для показу/приховування підказки
    this.toggleHintKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);

    // камера
    this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    this.scale.on("resize", () => {
      this.iso.recalcOrigin(this.scale.width, this.scale.height);
      this.tiles.redraw();
      this.player.place(this.player.cell);
      this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
    });
    
    const createEnd = performance.now();
    const createTime = (createEnd - createStart).toFixed(2);
    console.log(`✅ [SCENE] Create completed in ${createTime}ms`);
    console.log(`🎮 [SCENE] 🎉 GAME READY! Total time: ${createTime}ms`);
  }

  updateInfoText() {
    // ✅ Отримуємо актуального player з controller (може змінитися після switchCharacter)
    const currentPlayer = this.controller.player;
    let charName = "Unknown";
    
    if (currentPlayer.id === "hero") {
      charName = "Hero";
    } else if (currentPlayer.id === "cyberpunkMarsian") {
      charName = "Cyberpunk Marsian";
    } else if (currentPlayer.id === "warrior") {
      charName = "Warrior ⚔️";
    }
    
    this.infoText.setText(
      `Character: ${charName}\nC - switch character\n🏠 Explore 3 large houses with rooms!`
    );
  }

  update() {
    this.controller.update();
    this.updateInfoText();
    
    // ✅ Обробка клавіші H для показу/приховування підказки
    if (Phaser.Input.Keyboard.JustDown(this.toggleHintKey)) {
      this.controlsHint.toggle();
    }
  }
}
