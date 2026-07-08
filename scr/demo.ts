//Para ejecturar este demo, asegúrate de tener instalado tsx (npm install -g tsx) y luego ejecuta:
// npx tsx scr/demo.ts

import { MenuItem, Location, SaleTransaction, WasteRecord } from "./types/models";
import {
  filterSalesByLocation, filterSalesByDateRange, filterMenuItemsByCategory,
  filterActiveLocations, sortLocationsByCapacity, sortMenuItemsByPrice,
} from "./utils/collections";
import {
  findLocationById, findMenuItemByName, binarySearchLocationByCapacity,
} from "./utils/search";
import {
  convertCurrency, calculateDailyRevenue, calculateLocationMargin,
  calculateWasteCost, scoreLocationPerformance, rankLocationsByPerformance,
  countSalesByPaymentMethod, calculateAverageTicket, findTopSellingItems,
  groupWasteByReason, calculateCountryComparison,
} from "./utils/transformations";
import { validateMenuItem, validateSaleTransaction, validateLocation } from "./utils/validations";

// ── Datos de ejemplo (del CONTEXT-brasaland.es.md) ───────────────────────────

const sampleMenuItems: MenuItem[] = [
  {
    id: "ITEM-PICANHA-250",
    name: "Picanha 250g",
    category: "Meat",
    basePrice: { USD: 18.5, COP: 74000 },
    ingredientCost: { USD: 7.2, COP: 28800 },
    prepTimeMinutes: 15,
    isAvailableInColombia: true,
    isAvailableInUSA: true,
    allergens: [],
    status: "Active",
  },
  {
    id: "ITEM-FRIES",
    name: "Papas Fritas",
    category: "Side",
    basePrice: { USD: 4.5, COP: 18000 },
    ingredientCost: { USD: 1.2, COP: 4800 },
    prepTimeMinutes: 8,
    isAvailableInColombia: true,
    isAvailableInUSA: true,
    allergens: [],
    status: "Active",
  },
  {
    id: "ITEM-COKE",
    name: "Coca-Cola",
    category: "Beverage",
    basePrice: { USD: 2.5, COP: 10000 },
    ingredientCost: { USD: 0.8, COP: 3200 },
    prepTimeMinutes: 2,
    isAvailableInColombia: true,
    isAvailableInUSA: true,
    allergens: [],
    status: "Active",
  },
  {
    id: "ITEM-CHURROS",
    name: "Churros",
    category: "Dessert",
    basePrice: { USD: 5.0, COP: 20000 },
    ingredientCost: { USD: 1.5, COP: 6000 },
    prepTimeMinutes: 10,
    isAvailableInColombia: true,
    isAvailableInUSA: false,
    allergens: ["gluten"],
    status: "Seasonal",
  },
];

const sampleLocations: Location[] = [
  {
    id: "LOC-MEDELLIN-01",
    name: "Brasaland Medellín Centro",
    city: "Medellín",
    country: "Colombia",
    openingYear: 2008,
    seatingCapacity: 80,
    staffCount: 12,
    monthlyRentCost: { USD: 1500, COP: 6000000 },
    averageMonthlyUtilities: { USD: 400, COP: 1600000 },
    manager: "Carlos Jiménez",
    status: "Active",
  },
  {
    id: "LOC-MIAMI-01",
    name: "Brasaland Miami Beach",
    city: "Miami",
    country: "USA",
    openingYear: 2018,
    seatingCapacity: 100,
    staffCount: 15,
    monthlyRentCost: { USD: 5500, COP: 22000000 },
    averageMonthlyUtilities: { USD: 800, COP: 3200000 },
    manager: "Jake Morrison",
    status: "Active",
  },
  {
    id: "LOC-BOGOTA-01",
    name: "Brasaland Bogotá Zona Rosa",
    city: "Bogotá",
    country: "Colombia",
    openingYear: 2012,
    seatingCapacity: 60,
    staffCount: 10,
    monthlyRentCost: { USD: 1800, COP: 7200000 },
    averageMonthlyUtilities: { USD: 350, COP: 1400000 },
    manager: "Andrea Morales",
    status: "Temporarily closed",
  },
];

const sampleSales: SaleTransaction[] = [
  {
    id: "TXN-2024-15482",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 2,
    totalPrice: { USD: 37.0, COP: 148000 },
    paymentMethod: "Credit card",
    timestamp: new Date("2024-03-15T19:30:00"),
    waiterName: "María González",
  },
  {
    id: "TXN-2024-15483",
    locationId: "LOC-MIAMI-01",
    itemId: "ITEM-FRIES",
    quantity: 3,
    totalPrice: { USD: 13.5, COP: 54000 },
    paymentMethod: "Cash",
    timestamp: new Date("2024-03-15T20:15:00"),
    waiterName: "John Smith",
  },
  {
    id: "TXN-2024-15484",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-COKE",
    quantity: 4,
    totalPrice: { USD: 10.0, COP: 40000 },
    paymentMethod: "Digital wallet",
    timestamp: new Date("2024-03-15T21:00:00"),
    waiterName: "María González",
  },
  {
    id: "TXN-2024-15485",
    locationId: "LOC-MIAMI-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 1,
    totalPrice: { USD: 18.5, COP: 74000 },
    paymentMethod: "Debit card",
    timestamp: new Date("2024-03-16T13:00:00"),
    waiterName: "Lisa Torres",
  },
];

const sampleWasteRecords: WasteRecord[] = [
  {
    id: "WASTE-001",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 1,
    reason: "Cooking error",
    cost: { USD: 7.2, COP: 28800 },
    timestamp: new Date("2024-03-15T18:00:00"),
    reportedBy: "Carlos Ríos",
  },
  {
    id: "WASTE-002",
    locationId: "LOC-MIAMI-01",
    itemId: "ITEM-FRIES",
    quantity: 2,
    reason: "Expired",
    cost: { USD: 2.4, COP: 9600 },
    timestamp: new Date("2024-03-16T08:00:00"),
    reportedBy: "Linda Torres",
  },
];

// ── Demo ──────────────────────────────────────────────────────────────────────

console.log("=== BRASALAND DATA UTILS — DEMO (Hito 2) ===\n");

// Collections
console.log("--- Colecciones ---");
console.log("Ventas en Medellín:", filterSalesByLocation(sampleSales, "LOC-MEDELLIN-01").map(s => s.id));
console.log("Ventas del 15/03/2024:", filterSalesByDateRange(sampleSales, new Date("2024-03-15"), new Date("2024-03-15T23:59:59")).map(s => s.id));
console.log("Ítems de categoría Meat:", filterMenuItemsByCategory(sampleMenuItems, "Meat").map(i => i.name));
console.log("Locaciones activas:", filterActiveLocations(sampleLocations).map(l => l.name));
console.log("Locaciones por capacidad (asc):", sortLocationsByCapacity(sampleLocations, "asc").map(l => `${l.name} (${l.seatingCapacity})`));
console.log("Ítems por precio USD (desc):", sortMenuItemsByPrice(sampleMenuItems, "USD", "desc").map(i => `${i.name} $${i.basePrice.USD}`));

// Search
console.log("\n--- Búsquedas ---");
const locFound = findLocationById(sampleLocations, "LOC-MIAMI-01");
console.log("findLocationById LOC-MIAMI-01:", locFound ? locFound.name : "null");
const locMissing = findLocationById(sampleLocations, "LOC-FAKE");
console.log("findLocationById LOC-FAKE:", locMissing ? locMissing.name : "null");
const itemFound = findMenuItemByName(sampleMenuItems, "coca-cola");
console.log("findMenuItemByName 'coca-cola' (case-insensitive):", itemFound ? itemFound.name : "null");
const sortedForBinary = sortLocationsByCapacity(sampleLocations, "asc");
const binIdx = binarySearchLocationByCapacity(sortedForBinary, 100);
console.log("binarySearch capacity=100:", binIdx, "(nombre:", sortedForBinary[binIdx]?.name ?? "no encontrado", ")");
const binMiss = binarySearchLocationByCapacity(sortedForBinary, 999);
console.log("binarySearch capacity=999 (no existe):", binMiss);

// Transformations — Financiero
console.log("\n--- Cálculos Financieros ---");
console.log("convertCurrency 100 USD→COP:", convertCurrency(100, "USD", "COP"));
console.log("convertCurrency 400000 COP→USD:", convertCurrency(400000, "COP", "USD"));
console.log("convertCurrency 50 USD→USD (mismo):", convertCurrency(50, "USD", "USD"));
console.log("Ingreso diario 15/03/2024 USD:", calculateDailyRevenue(sampleSales, new Date("2024-03-15T12:00:00"), "USD"));
console.log("Margen LOC-MEDELLIN-01 USD:", calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MEDELLIN-01", "USD"), "%");
console.log("Costo desperdicio LOC-MEDELLIN-01 USD:", calculateWasteCost(sampleWasteRecords, "LOC-MEDELLIN-01", "USD"));

// Transformations — Scoring
console.log("\n--- Performance ---");
const score = scoreLocationPerformance(sampleLocations[0], sampleSales, sampleWasteRecords, sampleMenuItems);
console.log("Score LOC-MEDELLIN-01:", score);
const ranking = rankLocationsByPerformance(sampleLocations, sampleSales, sampleWasteRecords, sampleMenuItems);
console.log("Ranking:", ranking.map(r => `${r.location.name}: ${r.score}`));

// Transformations — Reportes
console.log("\n--- Reportes y Agregaciones ---");
console.log("Ventas por método de pago:", countSalesByPaymentMethod(sampleSales));
console.log("Ticket promedio USD:", calculateAverageTicket(sampleSales, "USD"));
console.log("Ticket promedio COP:", calculateAverageTicket(sampleSales, "COP"));
console.log("Top 2 más vendidos:", findTopSellingItems(sampleSales, sampleMenuItems, 2).map(r => `${r.item.name}: ${r.totalSold}`));
console.log("Desperdicio por razón:", Object.fromEntries(Object.entries(groupWasteByReason(sampleWasteRecords)).map(([k, v]) => [k, v.length])));
const comparison = calculateCountryComparison(sampleSales, sampleLocations, sampleMenuItems);
console.log("Comparativa Colombia:", comparison.Colombia);
console.log("Comparativa USA:", comparison.USA);

// Validations
console.log("\n--- Validaciones ---");
console.log("MenuItem válido:", validateMenuItem(sampleMenuItems[0]));
const badItem = validateMenuItem({ ...sampleMenuItems[0], name: "", basePrice: { USD: 0, COP: -1 }, prepTimeMinutes: 70, isAvailableInColombia: false, isAvailableInUSA: false });
console.log("MenuItem inválido:", badItem);
console.log("SaleTransaction válida:", validateSaleTransaction(sampleSales[0]));
const badSale = validateSaleTransaction({ ...sampleSales[0], quantity: 0, waiterName: "", totalPrice: { USD: -5, COP: 0 } });
console.log("SaleTransaction inválida:", badSale);
console.log("Location válida:", validateLocation(sampleLocations[0]));
const badLoc = validateLocation({ ...sampleLocations[0], openingYear: 1999, seatingCapacity: 0, staffCount: -1 });
console.log("Location inválida:", badLoc);

console.log("\n✓ Demo completado sin errores.");