import { SearchResult } from "../types/models";

// Búsqueda lineal por ID en cualquier array con propiedad id
export function linearSearchById<T extends { id: string }>(
  items: T[],
  id: string
): SearchResult<T> {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      return { found: true, index: i, item: items[i] };
    }
  }
  return { found: false, index: -1, item: null };
}

// Búsqueda lineal por campo de texto (nombre, email, etc.)
export function linearSearchByField<T>(
  items: T[],
  field: keyof T,
  value: string
): SearchResult<T> {
  const lowerValue = value.toLowerCase();
  for (let i = 0; i < items.length; i++) {
    const fieldValue = String(items[i][field]).toLowerCase();
    if (fieldValue.includes(lowerValue)) {
      return { found: true, index: i, item: items[i] };
    }
  }
  return { found: false, index: -1, item: null };
}

// Búsqueda binaria por ID en array ORDENADO por id
export function binarySearchById<T extends { id: string }>(
  sortedItems: T[],
  id: string
): SearchResult<T> {
  if (sortedItems.length === 0) return { found: false, index: -1, item: null };

  let left = 0;
  let right = sortedItems.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midId = sortedItems[mid].id;

    if (midId === id) {
      return { found: true, index: mid, item: sortedItems[mid] };
    }
    if (midId < id) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return { found: false, index: -1, item: null };
}

// Búsqueda binaria numérica en array ORDENADO por un campo numérico
export function binarySearchByNumericField<T>(
  sortedItems: T[],
  field: keyof T,
  value: number
): SearchResult<T> {
  if (sortedItems.length === 0) return { found: false, index: -1, item: null };

  let left = 0;
  let right = sortedItems.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = Number(sortedItems[mid][field]);

    if (midValue === value) {
      return { found: true, index: mid, item: sortedItems[mid] };
    }
    if (midValue < value) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return { found: false, index: -1, item: null };
}
