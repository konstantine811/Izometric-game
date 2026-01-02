import type { Direction8 } from "./direction";

/**
 * Порядок напрямків по годинниковій стрілці
 */
const DIRECTION_ORDER: Direction8[] = [
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east"
];

/**
 * Отримує індекс напрямку в циклічному масиві
 */
function getDirectionIndex(direction: Direction8): number {
  return DIRECTION_ORDER.indexOf(direction);
}

/**
 * Розраховує найкоротший шлях повороту між напрямками
 * 
 * @param from - початковий напрямок
 * @param to - цільовий напрямок
 * @returns масив проміжних напрямків (включаючи початковий і кінцевий)
 */
export function calculateTurnPath(from: Direction8, to: Direction8): Direction8[] {
  const fromIndex = getDirectionIndex(from);
  const toIndex = getDirectionIndex(to);
  
  if (fromIndex === toIndex) {
    return [from]; // Без повороту
  }
  
  const totalDirections = DIRECTION_ORDER.length;
  
  // Розраховуємо відстань по годинниковій і проти годинникової
  const clockwiseDistance = (toIndex - fromIndex + totalDirections) % totalDirections;
  const counterClockwiseDistance = (fromIndex - toIndex + totalDirections) % totalDirections;
  
  // 🔧 ВИПРАВЛЕННЯ: При рівних відстанях (180°) обираємо проти годинникової
  // Це запобігає зайвим поворотам на 180° по годинниковій
  const useClockwise = clockwiseDistance < counterClockwiseDistance;
  
  console.log('🔄 [TURN] Calculating turn path:');
  console.log('  - From:', from, `(index ${fromIndex})`);
  console.log('  - To:', to, `(index ${toIndex})`);
  console.log('  - Clockwise distance:', clockwiseDistance);
  console.log('  - Counter-clockwise distance:', counterClockwiseDistance);
  console.log('  - Using clockwise:', useClockwise);
  
  // Вибираємо найкоротший шлях
  const path: Direction8[] = [];
  
  if (useClockwise) {
    // По годинниковій (якщо коротше)
    for (let i = 0; i <= clockwiseDistance; i++) {
      const index = (fromIndex + i) % totalDirections;
      path.push(DIRECTION_ORDER[index]);
    }
  } else {
    // Проти годинникової (якщо коротше або рівно)
    for (let i = 0; i <= counterClockwiseDistance; i++) {
      const index = (fromIndex - i + totalDirections) % totalDirections;
      path.push(DIRECTION_ORDER[index]);
    }
  }
  
  console.log('  - Turn path:', path);
  
  return path;
}

/**
 * Розраховує тривалість повороту на основі кута
 * 
 * @param from - початковий напрямок
 * @param to - цільовий напрямок
 * @returns тривалість повороту в мілісекундах
 */
export function calculateTurnDuration(from: Direction8, to: Direction8): number {
  const path = calculateTurnPath(from, to);
  const steps = path.length - 1; // Кількість кроків (без початкового)
  
  if (steps === 0) return 0; // Без повороту
  
  // ✅ Прискорено для плавності: було 30ms, стало 15ms (в 2 рази швидше!)
  const BASE_STEP_DURATION = 15; // мс на 45°
  
  // Загальна тривалість
  return steps * BASE_STEP_DURATION;
}

/**
 * Отримує кут повороту в градусах
 * 
 * @param from - початковий напрямок
 * @param to - цільовий напрямок
 * @returns кут в градусах (0-180)
 */
export function getTurnAngle(from: Direction8, to: Direction8): number {
  const path = calculateTurnPath(from, to);
  const steps = path.length - 1;
  return steps * 45; // Кожен крок = 45°
}

