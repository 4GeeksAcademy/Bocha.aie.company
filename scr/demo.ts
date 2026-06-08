//Para ejecutar esta demo, asegúrate de tener instalado tsx (npm install -g tsx) y luego ejecuta:
//npx tsx scr/demo.ts

import { Restaurant, Product, Customer, Order, Employee, Supplier } from "./types/models";
import {
  filterProductsByCategory,
  filterAvailableProducts,
  filterOrdersByStatus,
  sortProductsByPrice,
  sortCustomersByPoints,
  groupOrdersByRestaurant,
  groupEmployeesByRole,
} from "./utils/collections";
import { linearSearchById, binarySearchById, linearSearchByField } from "./utils/search";
import {
  countOrdersByStatus,
  countProductsByCategory,
  sumRevenueUSD,
  averageTicketUSD,
  maxOrderUSD,
  minOrderUSD,
  generateSalesReport,
  topCustomersByPoints,
  countActiveEmployeesByCountry,
} from "./utils/transformations";
import {
  validateProduct,
  validateCustomer,
  validateOrder,
  validateEmployee,
  validateSupplier,
} from "./utils/validations";

// ─── Datos de ejemplo ────────────────────────────────────────────────────────

const restaurants: Restaurant[] = [
  {
    id: "r1",
    name: "Brasaland Medellín Centro",
    country: "Colombia",
    city: "Medellín",
    address: "Calle 50 #40-10",
    isOpen: true,
    openingHour: 11,
    closingHour: 22,
    currency: "COP",
  },
  {
    id: "r2",
    name: "Brasaland Miami",
    country: "USA",
    city: "Miami",
    address: "8th St NW 200",
    isOpen: true,
    openingHour: 12,
    closingHour: 23,
    currency: "USD",
  },
];

const products: Product[] = [
  { id: "p1", name: "Brasa Burger", category: "main", priceUSD: 12, priceCOP: 48000, isAvailable: true, ingredients: ["carne", "pan", "lechuga"] },
  { id: "p2", name: "Costillas BBQ", category: "main", priceUSD: 18, priceCOP: 72000, isAvailable: true, ingredients: ["costillas", "salsa BBQ"] },
  { id: "p3", name: "Papas fritas", category: "side", priceUSD: 5, priceCOP: 20000, isAvailable: true, ingredients: ["papa"] },
  { id: "p4", name: "Limonada", category: "beverage", priceUSD: 3, priceCOP: 12000, isAvailable: false, ingredients: ["limón", "agua", "azúcar"] },
  { id: "p5", name: "Combo Familiar", category: "combo", priceUSD: 35, priceCOP: 140000, isAvailable: true, ingredients: ["carne", "pollo", "costillas", "papas"] },
];

const customers: Customer[] = [
  { id: "c1", name: "Ana García", email: "ana@example.com", phone: "+573001234567", country: "Colombia", birthdate: "1990-03-15", brasaPoints: 450, registeredAt: "2023-01-10" },
  { id: "c2", name: "John Smith", email: "john@example.com", phone: "+13051234567", country: "USA", birthdate: "1985-07-22", brasaPoints: 1200, registeredAt: "2022-06-01" },
  { id: "c3", name: "María López", email: "maria@example.com", phone: "+573109876543", country: "Colombia", birthdate: "1995-11-30", brasaPoints: 80, registeredAt: "2024-02-20" },
];

const orders: Order[] = [
  { id: "o1", restaurantId: "r1", customerId: "c1", items: [{ productId: "p1", productName: "Brasa Burger", quantity: 2, unitPriceUSD: 12, unitPriceCOP: 48000 }], status: "delivered", currency: "COP", totalUSD: 24, totalCOP: 96000, createdAt: "2026-06-01T13:00:00Z" },
  { id: "o2", restaurantId: "r2", customerId: "c2", items: [{ productId: "p5", productName: "Combo Familiar", quantity: 1, unitPriceUSD: 35, unitPriceCOP: 140000 }], status: "delivered", currency: "USD", totalUSD: 35, totalCOP: 140000, createdAt: "2026-06-01T19:30:00Z" },
  { id: "o3", restaurantId: "r1", customerId: "c3", items: [{ productId: "p2", productName: "Costillas BBQ", quantity: 1, unitPriceUSD: 18, unitPriceCOP: 72000 }, { productId: "p3", productName: "Papas fritas", quantity: 1, unitPriceUSD: 5, unitPriceCOP: 20000 }], status: "pending", currency: "COP", totalUSD: 23, totalCOP: 92000, createdAt: "2026-06-06T12:15:00Z" },
];

const employees: Employee[] = [
  { id: "e1", name: "Carlos Ríos", email: "carlos@brasaland.com", role: "chef", restaurantId: "r1", country: "Colombia", hiredAt: "2021-03-01", isActive: true, salary: 3500000, salaryCurrency: "COP" },
  { id: "e2", name: "Linda Torres", email: "linda@brasaland.com", role: "manager", restaurantId: "r2", country: "USA", hiredAt: "2020-08-15", isActive: true, salary: 4500, salaryCurrency: "USD" },
  { id: "e3", name: "Pedro Vargas", email: "pedro@brasaland.com", role: "waiter", restaurantId: "r1", country: "Colombia", hiredAt: "2023-01-10", isActive: false, salary: 1800000, salaryCurrency: "COP" },
];

const suppliers: Supplier[] = [
  { id: "s1", name: "Carnes Premium", category: "meat", country: "Colombia", contactEmail: "ventas@carnespremium.co", priceHistory: [{ date: "2026-01-01", priceUSD: 8, productName: "Carne de res x kg" }], isActive: true },
  { id: "s2", name: "Florida Meats Inc", category: "meat", country: "USA", contactEmail: "sales@floridameats.com", priceHistory: [{ date: "2026-01-01", priceUSD: 12, productName: "Beef x lb" }], isActive: true },
];

// ─── Demo ─────────────────────────────────────────────────────────────────────

console.log("=== BRASALAND DATA UTILS — DEMO ===\n");

// Collections
console.log("--- Filtrado y ordenamiento ---");
console.log("Productos principales:", filterProductsByCategory(products, "main").map((p) => p.name));
console.log("Productos disponibles:", filterAvailableProducts(products).map((p) => p.name));
console.log("Órdenes pendientes:", filterOrdersByStatus(orders, "pending").map((o) => o.id));
console.log("Productos por precio (asc):", sortProductsByPrice(products).map((p) => `${p.name} $${p.priceUSD}`));
console.log("Clientes por puntos:", sortCustomersByPoints(customers).map((c) => `${c.name} (${c.brasaPoints}pts)`));
console.log("Órdenes por restaurante:", Object.keys(groupOrdersByRestaurant(orders)));
console.log("Empleados por rol:", Object.keys(groupEmployeesByRole(employees)));

// Search
console.log("\n--- Búsquedas ---");
const linearResult = linearSearchById(products, "p3");
console.log("Búsqueda lineal p3:", linearResult.found ? linearResult.item?.name : "no encontrado");

const sortedProducts = [...products].sort((a, b) => a.id.localeCompare(b.id));
const binaryResult = binarySearchById(sortedProducts, "p5");
console.log("Búsqueda binaria p5:", binaryResult.found ? binaryResult.item?.name : "no encontrado");

const fieldResult = linearSearchByField(customers, "name", "john");
console.log("Búsqueda por nombre 'john':", fieldResult.found ? fieldResult.item?.name : "no encontrado");

const notFound = binarySearchById(sortedProducts, "p99");
console.log("Búsqueda binaria p99 (no existe):", notFound.found ? notFound.item?.name : "no encontrado (índice: " + notFound.index + ")");

// Transformations
console.log("\n--- Aggregaciones y reportes ---");
console.log("Órdenes por estado:", countOrdersByStatus(orders));
console.log("Productos por categoría:", countProductsByCategory(products));
console.log("Total ventas USD:", sumRevenueUSD(orders));
console.log("Ticket promedio USD:", averageTicketUSD(orders).toFixed(2));
console.log("Orden máxima:", maxOrderUSD(orders)?.id, maxOrderUSD(orders)?.totalUSD, "USD");
console.log("Orden mínima:", minOrderUSD(orders)?.id, minOrderUSD(orders)?.totalUSD, "USD");
console.log("Top clientes:", topCustomersByPoints(customers, 2).map((c) => c.name));
console.log("Empleados activos por país:", countActiveEmployeesByCountry(employees));
const report = generateSalesReport(orders, restaurants);
console.log("Reporte de ventas:", report.map((r) => `${r.restaurantName}: $${r.totalRevenueUSD.toFixed(2)} USD (${r.totalOrders} órdenes)`));

// Validations
console.log("\n--- Validaciones ---");
const badProduct = validateProduct({ id: "", name: "Test", category: "main", priceUSD: -5, priceCOP: 0 });
console.log("Producto inválido:", badProduct.valid, badProduct.errors);

const goodCustomer = validateCustomer(customers[0]);
console.log("Cliente válido:", goodCustomer.valid, goodCustomer.errors);

const badOrder = validateOrder({ id: "o99", status: "unknown" as any, items: [] });
console.log("Orden inválida:", badOrder.valid, badOrder.errors);

const goodEmployee = validateEmployee(employees[0]);
console.log("Empleado válido:", goodEmployee.valid, goodEmployee.errors);

const badSupplier = validateSupplier({ id: "s3", name: "", category: "meat", country: "USA", contactEmail: "no-es-email" });
console.log("Proveedor inválido:", badSupplier.valid, badSupplier.errors);

console.log("\n✓ Demo completado sin errores.");
