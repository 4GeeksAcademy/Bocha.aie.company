import { MenuItem, SaleTransaction, Location } from "../types/models";

// ============================================================
// Brasaland — Validaciones de Datos de Negocio
// Verifica que los datos cumplen las reglas antes de procesarlos
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida todas las reglas de negocio para un ítem de menú.
 *
 * Reglas:
 * - Ambos precios USD y COP deben ser > 0
 * - ingredientCost USD y COP deben ser > 0
 * - prepTimeMinutes debe ser > 0 y <= 60
 * - name no debe estar vacío
 * - El ítem debe estar disponible en al menos un país
 */
export function validateMenuItem(item: MenuItem): ValidationResult {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push("name no debe estar vacío");
  }

  if (item.basePrice.USD <= 0) {
    errors.push("basePrice.USD debe ser > 0");
  }

  if (item.basePrice.COP <= 0) {
    errors.push("basePrice.COP debe ser > 0");
  }

  if (item.ingredientCost.USD <= 0) {
    errors.push("ingredientCost.USD debe ser > 0");
  }

  if (item.ingredientCost.COP <= 0) {
    errors.push("ingredientCost.COP debe ser > 0");
  }

  if (item.prepTimeMinutes <= 0 || item.prepTimeMinutes > 60) {
    errors.push("prepTimeMinutes debe ser > 0 y <= 60");
  }

  if (!item.isAvailableInColombia && !item.isAvailableInUSA) {
    errors.push("El ítem debe estar disponible en al menos un país");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida todas las reglas de negocio para una transacción de venta.
 *
 * Reglas:
 * - quantity debe ser > 0
 * - Ambos valores de precio (USD y COP) deben ser > 0
 * - waiterName no debe estar vacío
 */
export function validateSaleTransaction(sale: SaleTransaction): ValidationResult {
  const errors: string[] = [];

  if (sale.quantity <= 0) {
    errors.push("quantity debe ser > 0");
  }

  if (sale.totalPrice.USD <= 0) {
    errors.push("totalPrice.USD debe ser > 0");
  }

  if (sale.totalPrice.COP <= 0) {
    errors.push("totalPrice.COP debe ser > 0");
  }

  if (!sale.waiterName || sale.waiterName.trim().length === 0) {
    errors.push("waiterName no debe estar vacío");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida todas las reglas de negocio para una locación.
 *
 * Reglas:
 * - openingYear debe ser >= 2008 y <= año actual
 * - seatingCapacity debe ser > 0
 * - staffCount debe ser > 0
 * - Ambos costos de renta (USD y COP) deben ser > 0
 * - Ambos costos de servicios (USD y COP) deben ser > 0
 */
export function validateLocation(location: Location): ValidationResult {
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();

  if (location.openingYear < 2008 || location.openingYear > currentYear) {
    errors.push(`openingYear debe ser >= 2008 y <= ${currentYear}`);
  }

  if (location.seatingCapacity <= 0) {
    errors.push("seatingCapacity debe ser > 0");
  }

  if (location.staffCount <= 0) {
    errors.push("staffCount debe ser > 0");
  }

  if (location.monthlyRentCost.USD <= 0) {
    errors.push("monthlyRentCost.USD debe ser > 0");
  }

  if (location.monthlyRentCost.COP <= 0) {
    errors.push("monthlyRentCost.COP debe ser > 0");
  }

  if (location.averageMonthlyUtilities.USD <= 0) {
    errors.push("averageMonthlyUtilities.USD debe ser > 0");
  }

  if (location.averageMonthlyUtilities.COP <= 0) {
    errors.push("averageMonthlyUtilities.COP debe ser > 0");
  }

  return { valid: errors.length === 0, errors };
}