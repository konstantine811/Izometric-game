# 🎬 Стандарти Швидкості Анімацій

## 📊 Константи (characterConfig.ts)

```typescript
export const ANIMATION_SPEED_CONSTANTS = {
  WALK_ANIMATION_MULTIPLIER: 1.44,  // Для walk/idle/run
  ACTION_ANIMATION_MULTIPLIER: 1.2,  // Для action анімацій
  ACTION_TO_WALK_RATIO: 0.833,       // Співвідношення action/walk
}
```

---

## 🎯 Розрахунок FPS

### **Базовий FPS (15 кадрів):**
```
Базовий FPS = 15 кадрів / 0.6 сек = 25 FPS
```

### **Walk/Idle/Run FPS:**
```
Walk FPS = 25 × 1.44 = 36 FPS
Idle FPS = 18 × 1.44 = 26 FPS (≈25.92)
Run FPS = 25 × 1.44 = 36 FPS
```

### **Action FPS (cast, kick, melee, roll, etc.):**
```
Action FPS = 25 × 1.2 = 30 FPS
```

---

## 📋 Таблиця FPS

| Анімація | Кадрів | Базовий FPS | Множник | Фінальний FPS | Тривалість |
|----------|--------|-------------|---------|---------------|------------|
| **Walk** | 15 | 25 | 1.44× | **36** | 0.42s |
| **Idle** | 15 | 18 | 1.44× | **26** | 0.58s |
| **Run** | 15 | 25 | 1.44× | **36** | 0.42s |
| **Cast** | 15 | 25 | 1.2× | **30** | 0.50s |
| **Kick** | 15 | 25 | 1.2× | **30** | 0.50s |
| **Melee** | 15 | 25 | 1.2× | **30** | 0.50s |
| **Melee Spin** | 15 | 25 | 1.2× | **30** | 0.50s |
| **Roll** | 15 | 25 | 1.2× | **30** | 0.50s |
| **Turn** | 15 | 25 | 1.2× | **30** | 0.50s |

---

## ⚖️ Співвідношення

### **Action до Walk:**
```
Action FPS / Walk FPS = 30 / 36 = 0.833
Action на ~17% повільніші за Walk
```

### **Idle до Walk:**
```
Idle FPS / Walk FPS = 26 / 36 = 0.72
Idle на ~28% повільніший за Walk
```

### **Run до Walk:**
```
Run FPS / Walk FPS = 36 / 36 = 1.0
Run така сама швидкість як Walk (різниця тільки в швидкості руху!)
```

---

## 🎮 Використання

### **Для нового персонажа:**

```typescript
// AssetManifest.ts
import { ANIMATION_SPEED_CONSTANTS } from '../config/characterConfig';

newCharacter: {
  // ... інші параметри ...
  animationSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.WALK_ANIMATION_MULTIPLIER,  // 1.44
  actionSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.ACTION_ANIMATION_MULTIPLIER,   // 1.2
}
```

### **Якщо треба інша швидкість:**

```typescript
// Швидший персонаж (+20%)
animationSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.WALK_ANIMATION_MULTIPLIER * 1.2,  // 1.728

// Повільніший персонаж (-20%)
animationSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.WALK_ANIMATION_MULTIPLIER * 0.8,  // 1.152
```

---

## 📐 Формули

### **Розрахунок FPS:**
```typescript
// Базовий FPS
const baseFPS = frameCount / WALK_CYCLE_DURATION;  // 15 / 0.6 = 25

// Walk/Idle/Run FPS
const walkFPS = baseFPS × WALK_ANIMATION_MULTIPLIER;  // 25 × 1.44 = 36

// Action FPS
const actionFPS = baseFPS × ACTION_ANIMATION_MULTIPLIER;  // 25 × 1.2 = 30
```

### **Розрахунок тривалості:**
```typescript
// Тривалість анімації
const duration = frameCount / fps;  // 15 / 36 = 0.42 сек
```

---

## 🎯 Правила

1. ✅ **Всі нові персонажі** використовують `ANIMATION_SPEED_CONSTANTS`
2. ✅ **Walk/Idle/Run** використовують `WALK_ANIMATION_MULTIPLIER` (1.44)
3. ✅ **Action анімації** використовують `ACTION_ANIMATION_MULTIPLIER` (1.2)
4. ✅ **Співвідношення** завжди: Action на ~17% повільніші за Walk
5. ✅ **Максимальний FPS** обмежений до 60 (в characterConfig.ts)

---

## 📝 Приклад для нового персонажа

```typescript
// AssetManifest.ts
import { ANIMATION_SPEED_CONSTANTS } from '../config/characterConfig';

archer: {
  key: "archer",
  frameW: 128,
  frameH: 128,
  walkFrameCount: 12,
  idleFrameCount: 12,
  runFrameCount: 12,
  castFrameCount: 12,
  meleeFrameCount: 12,
  baseScale: 1.5,
  visualSize: 1.0,
  
  // ✅ Використовуємо стандартні константи!
  animationSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.WALK_ANIMATION_MULTIPLIER,
  actionSpeedMultiplier: ANIMATION_SPEED_CONSTANTS.ACTION_ANIMATION_MULTIPLIER,
  
  directions: ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"],
}
```

**Результат:**
- Walk: 20 FPS × 1.44 = **28.8 FPS** (≈29 FPS)
- Action: 20 FPS × 1.2 = **24 FPS**

---

**Останнє оновлення:** 31.12.2025  
**Версія:** 1.0

