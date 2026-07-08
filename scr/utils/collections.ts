import { SaleTransaction, MenuItem, Location, MenuCategory } from "../types/models";

// ============================================================
// Brasaland — Operaciones de Colecciones
// Todas las funciones son puras y no mutan los arrays originales
// ============================================================

/**
 * Retorna todas las ventas de la locación especificada.
 */
export function filterSalesByLocation(
  sales: SaleTransaction[],
  locationId: string
): SaleTransaction[] {
  return sales.filter((sale) => sale.locationId === locationId);
}

/**
 * Retorna ventas que ocurrieron entre startDate y endDate (inclusive).
 */
export function filterSalesByDateRange(
  sales: SaleTransaction[],
  startDate: Date,
  endDate: Date
): SaleTransaction[] {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return sales.filter((sale) => {
    const t = sale.timestamp.getTime();
    return t >= start && t <= end;
  });
}

/**
 * Retorna ítems de menú en la categoría especificada.
 */
export function filterMenuItemsByCategory(
  items: MenuItem[],
  category: MenuCategory
): MenuItem[] {
  return items.filter((item) => item.category === category);
}

/**
 * Retorna locaciones con estado "Active".
 */
export function filterActiveLocations(locations: Location[]): Location[] {
  return locations.filter((loc) => loc.status === "Active");
}

/**
 * Retorna locaciones ordenadas por capacidad de asientos.
 * No muta el array original.
 */
export function sortLocationsByCapacity(
  locations: Location[],
  order: "asc" | "desc"
): Location[] {
  return [...locations].sort((a, b) =>
    order === "asc"
      ? a.seatingCapacity - b.seatingCapacity
      : b.seatingCapacity - a.seatingCapacity
  );
}

/**
 * Retorna ítems de menú ordenados por precio en la moneda especificada.
 * No muta el array original.
 */
export function sortMenuItemsByPrice(
  items: MenuItem[],
  currency: "USD" | "COP",
  order: "asc" | "desc"
): MenuItem[] {
  return [...items].sort((a, b) =>
    order === "asc"
      ? a.basePrice[currency] - b.basePrice[currency]
      : b.basePrice[currency] - a.basePrice[currency]
  );
}