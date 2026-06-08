import { Product, Customer, Order, Employee, Supplier } from "../types/models";

// Filtra un array de productos por categoría
export function filterProductsByCategory(products: Product[], category: string): Product[] {
  return products.filter((p) => p.category === category);
}

// Filtra productos disponibles dentro de un rango de precio en USD
export function filterProductsByPriceRange(
  products: Product[],
  minUSD: number,
  maxUSD: number
): Product[] {
  return products.filter((p) => p.priceUSD >= minUSD && p.priceUSD <= maxUSD);
}

// Filtra productos por disponibilidad
export function filterAvailableProducts(products: Product[]): Product[] {
  return products.filter((p) => p.isAvailable);
}

// Filtra clientes por país
export function filterCustomersByCountry(customers: Customer[], country: string): Customer[] {
  return customers.filter((c) => c.country === country);
}

// Filtra órdenes por estado
export function filterOrdersByStatus(orders: Order[], status: string): Order[] {
  return orders.filter((o) => o.status === status);
}

// Filtra órdenes por restaurante
export function filterOrdersByRestaurant(orders: Order[], restaurantId: string): Order[] {
  return orders.filter((o) => o.restaurantId === restaurantId);
}

// Filtra empleados activos por restaurante
export function filterEmployeesByRestaurant(employees: Employee[], restaurantId: string): Employee[] {
  return employees.filter((e) => e.restaurantId === restaurantId && e.isActive);
}

// Filtra proveedores activos por categoría
export function filterSuppliersByCategory(suppliers: Supplier[], category: string): Supplier[] {
  return suppliers.filter((s) => s.category === category && s.isActive);
}

// Ordena productos por precio USD ascendente o descendente
export function sortProductsByPrice(products: Product[], ascending: boolean = true): Product[] {
  return [...products].sort((a, b) =>
    ascending ? a.priceUSD - b.priceUSD : b.priceUSD - a.priceUSD
  );
}

// Ordena clientes por brasaPoints
export function sortCustomersByPoints(customers: Customer[], ascending: boolean = false): Customer[] {
  return [...customers].sort((a, b) =>
    ascending ? a.brasaPoints - b.brasaPoints : b.brasaPoints - a.brasaPoints
  );
}

// Ordena órdenes por fecha de creación
export function sortOrdersByDate(orders: Order[], ascending: boolean = true): Order[] {
  return [...orders].sort((a, b) =>
    ascending
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Ordena órdenes por total en USD
export function sortOrdersByTotal(orders: Order[], ascending: boolean = false): Order[] {
  return [...orders].sort((a, b) =>
    ascending ? a.totalUSD - b.totalUSD : b.totalUSD - a.totalUSD
  );
}

// Agrupa órdenes por restaurantId
export function groupOrdersByRestaurant(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.restaurantId]) acc[order.restaurantId] = [];
    acc[order.restaurantId].push(order);
    return acc;
  }, {});
}

// Agrupa empleados por rol
export function groupEmployeesByRole(employees: Employee[]): Record<string, Employee[]> {
  return employees.reduce<Record<string, Employee[]>>((acc, emp) => {
    if (!acc[emp.role]) acc[emp.role] = [];
    acc[emp.role].push(emp);
    return acc;
  }, {});
}