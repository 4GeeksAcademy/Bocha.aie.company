import { Location, MenuItem } from "../types/models";

// ============================================================
// Brasaland — Operaciones de Búsqueda
// Búsqueda lineal para arrays desordenados
// Búsqueda binaria para arrays ordenados
// ============================================================

/**
 * Búsqueda LINEAL: encuentra una locación por ID.
 * Retorna la locación si se encuentra, null en caso contrario.
 */
export function findLocationById(
  locations: Location[],
  id: string
): Location | null {
  for (const location of locations) {
    if (location.id === id) return location;
  }
  return null;
}

/**
 * Búsqueda LINEAL: encuentra un ítem de menú por nombre (case-insensitive).
 * Retorna el ítem si se encuentra, null en caso contrario.
 */
export function findMenuItemByName(
  items: MenuItem[],
  name: string
): MenuItem | null {
  const lowerName = name.toLowerCase();
  for (const item of items) {
    if (item.name.toLowerCase() === lowerName) return item;
  }
  return null;
}

/**
 * Búsqueda BINARIA: busca por seatingCapacity en un array ya ordenado (asc).
 * Retorna el índice si se encuentra, -1 en caso contrario.
 *
 * PRECONDICIÓN: sortedLocations debe estar ordenado por seatingCapacity ascendente.
 */
export function binarySearchLocationByCapacity(
  sortedLocations: Location[],
  targetCapacity: number
): number {
  if (sortedLocations.length === 0) return -1;

  let left = 0;
  let right = sortedLocations.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midCapacity = sortedLocations[mid].seatingCapacity;

    if (midCapacity === targetCapacity) return mid;
    if (midCapacity < targetCapacity) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
