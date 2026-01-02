/**
 * ✅ UI підказка з клавішами керування в правому верхньому куті
 */
export class ControlsHint {
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;
  private visible: boolean = true;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create() {
    // Створюємо контейнер
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0); // ✅ Не рухається з камерою
    this.container.setDepth(1000); // ✅ Над усім

    // Фон
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRoundedRect(0, 0, 220, 520, 8);
    this.container.add(this.background);

    // Заголовок
    const title = this.scene.add.text(110, 15, 'CONTROLS', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // Список клавіш
    type ControlItem = 
      | { section: string; keys: never[] }
      | { key: string; action: string };
    
    const controls: ControlItem[] = [
      { section: 'Movement', keys: [] },
      { key: 'WASD/Arrows', action: 'Move' },
      { key: 'Shift + Move', action: 'Run' },
      { key: 'C', action: 'Change Character' },
      { section: 'Combat', keys: [] },
      { key: 'Q', action: 'Melee Attack' },
      { key: 'E', action: 'Cast Spell' },
      { key: 'K', action: 'Kick' },
      { key: 'T', action: 'Turn 180°' },
      { key: 'R', action: 'Melee 2' },
      { key: 'F', action: 'Melee Spin' },
      { section: 'Special', keys: [] },
      { key: '1', action: 'Special Attack 1' },
      { key: '2', action: 'Special Attack 2' },
      { key: 'V', action: 'Roll (Forward)' },
      { section: 'Other', keys: [] },
      { key: 'B', action: 'Shield Block' },
      { key: 'Z', action: 'Take Damage' },
      { key: 'X', action: 'Die (demo)' },
    ];

    let yOffset = 45;
    controls.forEach((control) => {
      if ('section' in control && control.section) {
        // Розділ
        const sectionText = this.scene.add.text(110, yOffset, control.section, {
          fontSize: '13px',
          fontFamily: 'Arial',
          color: '#FFA500',
          fontStyle: 'bold',
        });
        sectionText.setOrigin(0.5, 0);
        this.container.add(sectionText);
        yOffset += 20;
      } else if ('key' in control && 'action' in control && control.key && control.action) {
        // Клавіша
        const keyText = this.scene.add.text(15, yOffset, control.key, {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#00FF00',
          fontStyle: 'bold',
        });
        keyText.setOrigin(0, 0);
        this.container.add(keyText);

        // Дія
        const actionText = this.scene.add.text(90, yOffset, control.action, {
          fontSize: '11px',
          fontFamily: 'Arial',
          color: '#FFFFFF',
        });
        actionText.setOrigin(0, 0);
        this.container.add(actionText);
        yOffset += 18;
      }
    });

    // Позиціонуємо в правому верхньому куті
    this.updatePosition();
  }

  private updatePosition() {
    const camera = this.scene.cameras.main;
    this.container.setPosition(camera.width - 240, 20);
  }

  toggle() {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
  }

  show() {
    this.visible = true;
    this.container.setVisible(true);
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
  }

  destroy() {
    this.container.destroy();
  }
}

