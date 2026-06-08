import {
  SaleTransaction,
  MenuItem,
  Location,
  WasteRecord,
  WasteReason,
  PaymentMethod,
  CountryMetrics,
  Price,
} from "../types/models";
import { filterSalesByLocation } from "./collections";

// ============================================================
// Brasaland — Cálculos Financieros, Scoring y Reportes
// Tasa de cambio fija: 1 USD = 4000 COP
// ============================================================

const USD_TO_COP_RATE = 4000;

// ── Conversión de moneda ──────────────────────────────────────────────────────

/**
 * Convierte entre USD y COP usando tasa fija: 1 USD = 4000 COP.
 * Retorna cantidad convertida redondeada a 2 decimales.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: "USD" | "COP",
  toCurrency: "USD" | "COP"
): number {
  if (fromCurrency === toCurrency) return amount;

  const converted =
    fromCurrency === "USD"
      ? amount * USD_TO_COP_RATE
      : amount / USD_TO_COP_RATE;

  return Math.round(converted * 100) / 100;
}

// ── Cálculos financieros ──────────────────────────────────────────────────────

/**
 * Calcula el ingreso total para una fecha específica en la moneda dada.
 * Retorna total redondeado a 2 decimales.
 */
export function calculateDailyRevenue(
  sales: SaleTransaction[],
  date: Date,
  currency: "USD" | "COP"
): number {
  // Comparamos año/mes/día en hora local para evitar desfases UTC
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  const total = sales
    .filter((sale) => {
      const t = sale.timestamp;
      return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
    })
    .reduce((sum, sale) => sum + sale.totalPrice[currency], 0);

  return Math.round(total * 100) / 100;
}

/**
 * Calcula margen de ganancia para una locación.
 * Fórmula: ((Ingreso Total - Costo Total de Ingredientes) / Ingreso Total) * 100
 * Retorna margen como porcentaje (0-100), redondeado a 2 decimales.
 */
export function calculateLocationMargin(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  locationId: string,
  currency: "USD" | "COP"
): number {
  const locationSales = filterSalesByLocation(sales, locationId);
  if (locationSales.length === 0) return 0;

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

  let totalRevenue = 0;
  let totalIngredientCost = 0;

  for (const sale of locationSales) {
    const item = menuItemMap.get(sale.itemId);
    totalRevenue += sale.totalPrice[currency];
    if (item) {
      totalIngredientCost += item.ingredientCost[currency] * sale.quantity;
    }
  }

  if (totalRevenue === 0) return 0;

  const margin = ((totalRevenue - totalIngredientCost) / totalRevenue) * 100;
  return Math.round(margin * 100) / 100;
}

/**
 * Calcula costo total de desperdicio para una locación en la moneda especificada.
 * Retorna total redondeado a 2 decimales.
 */
export function calculateWasteCost(
  wasteRecords: WasteRecord[],
  locationId: string,
  currency: "USD" | "COP"
): number {
  const total = wasteRecords
    .filter((record) => record.locationId === locationId)
    .reduce((sum, record) => sum + record.cost[currency], 0);
  return Math.round(total * 100) / 100;
}

// ── Scoring de performance ────────────────────────────────────────────────────

/**
 * Calcula un puntaje de performance (0-100) para una locación basado en:
 * - Performance de ingresos (40 pts máx)
 * - Eficiencia de asientos (30 pts máx)
 * - Control de desperdicio (20 pts máx)
 * - Margen de ganancia (10 pts máx)
 */
export function scoreLocationPerformance(
  location: Location,
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[]
): number {
  const locationSales = filterSalesByLocation(sales, location.id);
  const totalRevenueUSD = locationSales.reduce(
    (sum, sale) => sum + sale.totalPrice.USD,
    0
  );

  // Días operativos estimados desde año de apertura
  const currentYear = new Date().getFullYear();
  const yearsOpen = Math.max(currentYear - location.openingYear, 1);
  const operativeDays = yearsOpen * 365;

  // 1. Performance de ingresos (40 pts máx)
  const dailyAvgUSD = totalRevenueUSD / operativeDays;
  const revenueScore = Math.min((dailyAvgUSD / 1000) * 40, 40);

  // 2. Eficiencia de asientos (30 pts máx)
  const efficiencyScore = Math.min(
    (locationSales.length / location.seatingCapacity) * 30,
    30
  );

  // 3. Control de desperdicio (20 pts máx)
  const wasteCostUSD = calculateWasteCost(wasteRecords, location.id, "USD");
  const wastePercentage =
    totalRevenueUSD > 0 ? (wasteCostUSD / totalRevenueUSD) * 100 : 0;
  const wasteScore = Math.max(20 - wastePercentage * 2, 0);

  // 4. Margen de ganancia (10 pts máx)
  const margin = calculateLocationMargin(sales, menuItems, location.id, "USD");
  const marginScore = Math.min(margin / 10, 10);

  const totalScore = revenueScore + efficiencyScore + wasteScore + marginScore;
  return Math.round(totalScore * 100) / 100;
}

/**
 * Puntúa todas las locaciones y las retorna ordenadas por puntaje (más alto primero).
 */
export function rankLocationsByPerformance(
  locations: Location[],
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[]
): Array<{ location: Location; score: number }> {
  return locations
    .map((location) => ({
      location,
      score: scoreLocationPerformance(location, sales, wasteRecords, menuItems),
    }))
    .sort((a, b) => b.score - a.score);
}

// ── Agregaciones y Reportes ───────────────────────────────────────────────────

/**
 * Retorna conteo de ventas para cada método de pago.
 */
export function countSalesByPaymentMethod(
  sales: SaleTransaction[]
): Record<PaymentMethod, number> {
  const result: Record<PaymentMethod, number> = {
    Cash: 0,
    "Credit card": 0,
    "Debit card": 0,
    "Digital wallet": 0,
  };
  for (const sale of sales) {
    result[sale.paymentMethod] += 1;
  }
  return result;
}

/**
 * Retorna valor promedio de venta en la moneda especificada, redondeado a 2 decimales.
 */
export function calculateAverageTicket(
  sales: SaleTransaction[],
  currency: "USD" | "COP"
): number {
  if (sales.length === 0) return 0;
  const total = sales.reduce((sum, sale) => sum + sale.totalPrice[currency], 0);
  return Math.round((total / sales.length) * 100) / 100;
}

/**
 * Encuentra los N ítems de menú más vendidos, ordenados por cantidad vendida (desc).
 */
export function findTopSellingItems(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  topN: number
): Array<{ item: MenuItem; totalSold: number }> {
  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
  const soldMap = new Map<string, number>();

  for (const sale of sales) {
    soldMap.set(sale.itemId, (soldMap.get(sale.itemId) ?? 0) + sale.quantity);
  }

  return Array.from(soldMap.entries())
    .map(([itemId, totalSold]) => {
      const item = menuItemMap.get(itemId);
      return item ? { item, totalSold } : null;
    })
    .filter((entry): entry is { item: MenuItem; totalSold: number } => entry !== null)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, topN);
}

/**
 * Agrupa registros de desperdicio por razón.
 */
export function groupWasteByReason(
  wasteRecords: WasteRecord[]
): Record<WasteReason, WasteRecord[]> {
  const result: Record<WasteReason, WasteRecord[]> = {
    Expired: [],
    "Cooking error": [],
    "Customer return": [],
    Damage: [],
    Other: [],
  };
  for (const record of wasteRecords) {
    result[record.reason].push(record);
  }
  return result;
}

/**
 * Calcula métricas comparativas por país (Colombia vs USA).
 */
export function calculateCountryComparison(
  sales: SaleTransaction[],
  locations: Location[],
  menuItems: MenuItem[]
): { Colombia: CountryMetrics; USA: CountryMetrics } {
  const countries: Array<"Colombia" | "USA"> = ["Colombia", "USA"];
  const result = {} as { Colombia: CountryMetrics; USA: CountryMetrics };

  for (const country of countries) {
    const countryLocations = locations.filter((loc) => loc.country === country);
    const countryLocationIds = new Set(countryLocations.map((loc) => loc.id));
    const countrySales = sales.filter((sale) =>
      countryLocationIds.has(sale.locationId)
    );

    const totalRevenueUSD = countrySales.reduce(
      (sum, sale) => sum + sale.totalPrice.USD,
      0
    );
    const totalRevenueCOP = countrySales.reduce(
      (sum, sale) => sum + sale.totalPrice.COP,
      0
    );

    const locationCount = countryLocations.length;
    const avgUSD = locationCount > 0 ? totalRevenueUSD / locationCount : 0;
    const avgCOP = locationCount > 0 ? totalRevenueCOP / locationCount : 0;

    result[country] = {
      totalLocations: locationCount,
      totalRevenue: {
        USD: Math.round(totalRevenueUSD * 100) / 100,
        COP: Math.round(totalRevenueCOP * 100) / 100,
      },
      averageRevenuePerLocation: {
        USD: Math.round(avgUSD * 100) / 100,
        COP: Math.round(avgCOP * 100) / 100,
      },
      totalSales: countrySales.length,
    };
  }

  return result;
}
