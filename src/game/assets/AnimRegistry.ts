// src/game/assets/AnimRegistry.ts
import Phaser from "phaser";
import { SPRITES, type SpriteId } from "./AssetManifest";

export function preloadSprites(scene: Phaser.Scene) {
  console.log('⏱️ [PERFORMANCE] Starting sprite preload...');
  const totalStart = performance.now();
  
  (Object.keys(SPRITES) as SpriteId[]).forEach((id) => {
    const charStart = performance.now();
    const s = SPRITES[id];
    console.log(`⏱️ Loading character: ${id}...`);
    
    // Для персонажів з окремими напрямками (8-directional)
    if ("directions" in s && Array.isArray(s.directions)) {
      const directions = s.directions as string[];
      const walkFrameCount = s.walkFrameCount;
      const idleFrameCount = s.idleFrameCount;
      
      // 🧪 Для клонів: використовуємо spriteSourceKey для шляхів до файлів
      const sourceKey = ('spriteSourceKey' in s && s.spriteSourceKey) ? s.spriteSourceKey as string : s.key;
      
      // Визначаємо базовий шлях (використовуємо sourceKey!)
      let basePath = `/sprites/${sourceKey}/animations`;
      if (sourceKey === "cyberpunk-marsian") {
        basePath = "/sprites/cyberpunk-marsian/animations";
      }
      
      directions.forEach((dir) => {
        // Завантажуємо walking анімацію
        for (let i = 0; i < walkFrameCount; i++) {
          const frameKey = `${s.key}-walk-${dir}-${i}`;
          const paddedIndex = i.toString().padStart(3, '0');
          const framePath = `${basePath}/walking/${dir}/frame_${paddedIndex}.png`;
          scene.load.image(frameKey, framePath);
        }
        
        // Завантажуємо idle анімацію
        const idlePath = sourceKey === "cyberpunk-marsian" ? "breathing-idle" : "idle";
        for (let i = 0; i < idleFrameCount; i++) {
          const frameKey = `${s.key}-idle-${dir}-${i}`;
          const paddedIndex = i.toString().padStart(3, '0');
          const framePath = `${basePath}/${idlePath}/${dir}/frame_${paddedIndex}.png`;
          scene.load.image(frameKey, framePath);
        }
        
        // ✅ Завантажуємо run анімацію (якщо є)
        if ('runFrameCount' in s && typeof s.runFrameCount === 'number') {
          for (let i = 0; i < s.runFrameCount; i++) {
            const frameKey = `${s.key}-run-${dir}-${i}`;
            const paddedIndex = i.toString().padStart(3, '0');
            const framePath = `${basePath}/run/${dir}/frame_${paddedIndex}.png`;
            scene.load.image(frameKey, framePath);
          }
        }
        
        // ✅ Завантажуємо turn анімацію (якщо є)
        if ('turnFrameCount' in s && typeof s.turnFrameCount === 'number') {
          for (let i = 0; i < s.turnFrameCount; i++) {
            const frameKey = `${s.key}-turn-${dir}-${i}`;
            const paddedIndex = i.toString().padStart(3, '0');
            const framePath = `${basePath}/turn/${dir}/frame_${paddedIndex}.png`;
            scene.load.image(frameKey, framePath);
          }
        }
        
        // ✅ Завантажуємо cast spell анімацію (якщо є)
        if ('castFrameCount' in s && typeof s.castFrameCount === 'number') {
          for (let i = 0; i < s.castFrameCount; i++) {
            const frameKey = `${s.key}-cast-${dir}-${i}`;
            const paddedIndex = i.toString().padStart(3, '0');
            const framePath = `${basePath}/cast/${dir}/frame_${paddedIndex}.png`;
            scene.load.image(frameKey, framePath);
          }
        }
        
        // ✅ Завантажуємо kick анімацію (якщо є)
        if ('kickFrameCount' in s && typeof s.kickFrameCount === 'number') {
          for (let i = 0; i < s.kickFrameCount; i++) {
            const frameKey = `${s.key}-kick-${dir}-${i}`;
            const paddedIndex = i.toString().padStart(3, '0');
            const framePath = `${basePath}/kick/${dir}/frame_${paddedIndex}.png`;
            scene.load.image(frameKey, framePath);
          }
        }
        
        // ✅ Завантажуємо melee attack анімацію (якщо є)
        if ('meleeFrameCount' in s && typeof s.meleeFrameCount === 'number') {
          for (let i = 0; i < s.meleeFrameCount; i++) {
            const frameKey = `${s.key}-melee-${dir}-${i}`;
            const paddedIndex = i.toString().padStart(3, '0');
            const framePath = `${basePath}/melee/${dir}/frame_${paddedIndex}.png`;
            scene.load.image(frameKey, framePath);
          }
        }
        
        // ✅ Завантажуємо додаткові анімації
        const extraAnimations = [
          { countKey: 'dieFrameCount', nameKey: 'die' },
          { countKey: 'damageFrameCount', nameKey: 'damage' },
          { countKey: 'shieldBlockFrameCount', nameKey: 'shield-block' },
          { countKey: 'melee2FrameCount', nameKey: 'melee2' },
          { countKey: 'meleeSpinFrameCount', nameKey: 'melee-spin' },
          { countKey: 'special1FrameCount', nameKey: 'special1' },
          { countKey: 'special2FrameCount', nameKey: 'special2' },
          { countKey: 'rollFrameCount', nameKey: 'roll' },
        ];
        
        extraAnimations.forEach(({ countKey, nameKey }) => {
          if (countKey in s && typeof (s as any)[countKey] === 'number') {
            const frameCount = (s as any)[countKey] as number;
            for (let i = 0; i < frameCount; i++) {
              const frameKey = `${s.key}-${nameKey}-${dir}-${i}`;
              const paddedIndex = i.toString().padStart(3, '0');
              const framePath = `${basePath}/${nameKey}/${dir}/frame_${paddedIndex}.png`;
              scene.load.image(frameKey, framePath);
            }
          }
        });
      });
    } else {
      // Звичайний spritesheet
      scene.load.spritesheet(s.key, s.url, {
        frameWidth: s.frameW,
        frameHeight: s.frameH,
      });
    }
    
    const charEnd = performance.now();
    const charTime = (charEnd - charStart).toFixed(2);
    console.log(`✅ Loaded ${id} in ${charTime}ms`);
  });
  
  const totalEnd = performance.now();
  const totalTime = (totalEnd - totalStart).toFixed(2);
  console.log(`⏱️ [PERFORMANCE] Total preload time: ${totalTime}ms`);
}

export function ensureCharacterAnims(scene: Phaser.Scene, id: SpriteId) {
  const animStart = performance.now();
  console.log(`⏱️ Creating animations for ${id}...`);
  
  const s = SPRITES[id];
  const idleKey = `${s.key}-idle`;
  const walkKey = `${s.key}-walk`;
  if (scene.anims.exists(idleKey)) {
    console.log(`✅ Animations for ${id} already exist (cached)`);
    return;
  }

  // Для персонажів з 8 напрямками
  if ("directions" in s && Array.isArray(s.directions)) {
    const directions = s.directions as string[];
    const walkFrameCount = s.walkFrameCount;
    const idleFrameCount = s.idleFrameCount;
    
    // ✅ Використовуємо розраховані FPS з конфігурації!
    const walkFPS = s.walkFPS || 8;
    const idleFPS = s.idleFPS || 6;
    
    // Створюємо анімації для кожного напрямку
    directions.forEach((dir) => {
      // Walk анімація
      const walkFrames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < walkFrameCount; i++) {
        walkFrames.push({ key: `${s.key}-walk-${dir}-${i}` });
      }
      
      scene.anims.create({
        key: `${s.key}-walk-${dir}`,
        frames: walkFrames,
        frameRate: walkFPS,
        repeat: -1,
      });
      
      // Idle анімація
      const idleFrames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < idleFrameCount; i++) {
        idleFrames.push({ key: `${s.key}-idle-${dir}-${i}` });
      }
      
      scene.anims.create({
        key: `${s.key}-idle-${dir}`,
        frames: idleFrames,
        frameRate: idleFPS,
        repeat: -1,
      });
      
      // ✅ Run анімація (якщо є)
      if ('runFrameCount' in s && typeof s.runFrameCount === 'number') {
        const runFrames: Phaser.Types.Animations.AnimationFrame[] = [];
        for (let i = 0; i < s.runFrameCount; i++) {
          runFrames.push({ key: `${s.key}-run-${dir}-${i}` });
        }
        
        const runFPS = s.runFPS || walkFPS;
        
        scene.anims.create({
          key: `${s.key}-run-${dir}`,
          frames: runFrames,
          frameRate: runFPS,
          repeat: -1,
        });
      }
      
      // ✅ Turn анімація (якщо є)
      if ('turnFrameCount' in s && typeof s.turnFrameCount === 'number') {
        const turnFrames: Phaser.Types.Animations.AnimationFrame[] = [];
        for (let i = 0; i < s.turnFrameCount; i++) {
          turnFrames.push({ key: `${s.key}-turn-${dir}-${i}` });
        }
        
        const turnFPS = s.turnFPS || walkFPS;
        
        scene.anims.create({
          key: `${s.key}-turn-${dir}`,
          frames: turnFrames,
          frameRate: turnFPS,
          repeat: 0, // ✅ Не повторювати - це action!
        });
      }
      
      // ✅ Cast spell анімація (якщо є)
      if ('castFrameCount' in s && typeof s.castFrameCount === 'number') {
        const castFrames: Phaser.Types.Animations.AnimationFrame[] = [];
        for (let i = 0; i < s.castFrameCount; i++) {
          castFrames.push({ key: `${s.key}-cast-${dir}-${i}` });
        }
        
        const castFPS = s.castFPS || walkFPS;
        
        scene.anims.create({
          key: `${s.key}-cast-${dir}`,
          frames: castFrames,
          frameRate: castFPS,
          repeat: 0, // ✅ Не повторювати - це action!
        });
      }
      
      // ✅ Kick анімація (якщо є)
      if ('kickFrameCount' in s && typeof s.kickFrameCount === 'number') {
        const kickFrames: Phaser.Types.Animations.AnimationFrame[] = [];
        for (let i = 0; i < s.kickFrameCount; i++) {
          kickFrames.push({ key: `${s.key}-kick-${dir}-${i}` });
        }
        
        const kickFPS = s.kickFPS || walkFPS;
        
        scene.anims.create({
          key: `${s.key}-kick-${dir}`,
          frames: kickFrames,
          frameRate: kickFPS,
          repeat: 0, // ✅ Не повторювати - це action!
        });
      }
      
      // ✅ Melee attack анімація (якщо є)
      if ('meleeFrameCount' in s && typeof s.meleeFrameCount === 'number') {
        const meleeFrames: Phaser.Types.Animations.AnimationFrame[] = [];
        for (let i = 0; i < s.meleeFrameCount; i++) {
          meleeFrames.push({ key: `${s.key}-melee-${dir}-${i}` });
        }
        
        const meleeFPS = s.meleeFPS || walkFPS;
        
        scene.anims.create({
          key: `${s.key}-melee-${dir}`,
          frames: meleeFrames,
          frameRate: meleeFPS,
          repeat: 0, // ✅ Не повторювати - це action!
        });
      }
      
      // ✅ Додаткові анімації (die, damage, shield, etc.)
      const extraAnimations = [
        { countKey: 'dieFrameCount', fpsKey: 'dieFPS', name: 'die' },
        { countKey: 'damageFrameCount', fpsKey: 'damageFPS', name: 'damage' },
        { countKey: 'shieldBlockFrameCount', fpsKey: 'shieldBlockFPS', name: 'shield-block' },
        { countKey: 'melee2FrameCount', fpsKey: 'melee2FPS', name: 'melee2' },
        { countKey: 'meleeSpinFrameCount', fpsKey: 'meleeSpinFPS', name: 'melee-spin' },
        { countKey: 'special1FrameCount', fpsKey: 'special1FPS', name: 'special1' },
        { countKey: 'special2FrameCount', fpsKey: 'special2FPS', name: 'special2' },
        { countKey: 'rollFrameCount', fpsKey: 'rollFPS', name: 'roll' },
      ];
      
      extraAnimations.forEach(({ countKey, fpsKey, name }) => {
        if (countKey in s && typeof (s as any)[countKey] === 'number') {
          const frameCount = (s as any)[countKey] as number;
          const frames: Phaser.Types.Animations.AnimationFrame[] = [];
          
          for (let i = 0; i < frameCount; i++) {
            frames.push({ key: `${s.key}-${name}-${dir}-${i}` });
          }
          
          const fps = (s as any)[fpsKey] || walkFPS;
          
          scene.anims.create({
            key: `${s.key}-${name}-${dir}`,
            frames,
            frameRate: fps,
            repeat: name === 'die' ? 0 : 0, // ✅ Всі action не повторюються
          });
        }
      });
    });
    
    // Дефолтні idle та walk (використовуємо south або перший напрямок)
    const defaultDir = directions.includes("south") ? "south" : directions[0];
    
    const defaultIdleFrames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < idleFrameCount; i++) {
      defaultIdleFrames.push({ key: `${s.key}-idle-${defaultDir}-${i}` });
    }
    
    scene.anims.create({
      key: idleKey,
      frames: defaultIdleFrames,
      frameRate: idleFPS,
      repeat: -1,
    });
    
    const defaultWalkFrames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < walkFrameCount; i++) {
      defaultWalkFrames.push({ key: `${s.key}-walk-${defaultDir}-${i}` });
    }
    
    scene.anims.create({
      key: walkKey,
      frames: defaultWalkFrames,
      frameRate: walkFPS,
      repeat: -1,
    });
    
    // ✅ Дефолтна run анімація (якщо є)
    if ('runFrameCount' in s && typeof s.runFrameCount === 'number') {
      const defaultRunFrames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < s.runFrameCount; i++) {
        defaultRunFrames.push({ key: `${s.key}-run-${defaultDir}-${i}` });
      }
      
      const runFPS = walkFPS; // Така сама як walk
      const runKey = `${s.key}-run`;
      
      scene.anims.create({
        key: runKey,
        frames: defaultRunFrames,
        frameRate: runFPS,
        repeat: -1,
      });
    }
  } else {
    // Стандартні анімації для spritesheet (hero)
    const walkFPS = s.walkFPS || 10;
    const idleFPS = s.idleFPS || 1;
    const walkFrameCount = s.walkFrameCount || 8;
    
    scene.anims.create({
      key: idleKey,
      frames: [{ key: s.key, frame: 0 }],
      frameRate: idleFPS,
      repeat: -1,
    });

    scene.anims.create({
      key: walkKey,
      frames: scene.anims.generateFrameNumbers(s.key, { start: 0, end: walkFrameCount - 1 }),
      frameRate: walkFPS,
      repeat: -1,
    });
  }
  
  const animEnd = performance.now();
  const animTime = (animEnd - animStart).toFixed(2);
  console.log(`✅ Created animations for ${id} in ${animTime}ms`);
}
